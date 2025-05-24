using FireFishPortfolioManager.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Loan = FireFishPortfolioManager.Data.Loan;
using SellOrder = FireFishPortfolioManager.Data.SellOrder;
using LoanStatus = FireFishPortfolioManager.Data.LoanStatus;
using SellOrderStatus = FireFishPortfolioManager.Data.SellOrderStatus;
using FireFishPortfolioManager.Api.Models;
using Newtonsoft.Json;

namespace FireFishPortfolioManager.Api.Services
{
    public class LoanService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoanService> _logger;
        private readonly CoinmateService _coinmateService;
        private readonly PortfolioCalculationService _calculationService;
        private readonly ExitStrategyService _exitStrategyService;

        public LoanService(
            ApplicationDbContext context,
            ILogger<LoanService> logger,
            CoinmateService coinmateService,
            PortfolioCalculationService calculationService,
            ExitStrategyService exitStrategyService)
        {
            _context = context;
            _logger = logger;
            _coinmateService = coinmateService;
            _calculationService = calculationService;
            _exitStrategyService = exitStrategyService;
        }

        /// <summary>
        /// Adds a new loan for a user
        /// </summary>
        public async Task<Loan> AddLoanAsync(string userId, Loan loan)
        {
            if (loan == null)
                throw new ArgumentNullException(nameof(loan));

            // Set the user ID and ensure we have current BTC price
            loan.UserId = userId;
            
            // Use default status of Active for new loans
            if (loan.Status == default)
                loan.Status = LoanStatus.Active;
                
            // Calculate automatic fields: repayment date, amount, fees, collateral, total sent
            loan.RepaymentDate = loan.LoanDate.AddMonths(loan.LoanPeriodMonths);
            var days = (loan.RepaymentDate - loan.LoanDate).Days;
            var interestFactor = 1 + ((loan.InterestRate / 100m) * days / 365m);
            loan.RepaymentAmountCzk = loan.LoanAmountCzk * interestFactor;
            
            // Get user for LTV settings
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
                
            // Calculate total BTC sent
            loan.TotalSentBtc = loan.CollateralBtc + loan.TransactionFeesBtc + loan.FeesBtc;
            

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Added new loan {LoanId} for user {UserId}", loan.Id, userId);
            
            return loan;
        }

        /// <summary>
        /// Updates an existing loan. Also regenerates planned sell orders if a relevant strategy is saved.
        /// </summary>
        public async Task<Loan> UpdateLoanAsync(string userId, int loanId, Loan loanUpdate)
        {
            if (loanUpdate == null)
                throw new ArgumentNullException(nameof(loanUpdate));

            var loan = await _context.Loans
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
            {
                _logger.LogWarning("Loan {LoanId} not found for user {UserId}", loanId, userId);
                throw new KeyNotFoundException($"Loan {loanId} not found");
            }

            bool strategyChanged = loan.StrategyJson != loanUpdate.StrategyJson;
             _logger.LogInformation("[Loan {LoanId}] Strategy changed detection: {StrategyChanged}. Old JSON: {OldJson}, New JSON: {NewJson}",
                                 loanId, strategyChanged, loan.StrategyJson ?? "null", loanUpdate.StrategyJson ?? "null");

            // Update core fields and recalculate automatic values
            loan.LoanId = loanUpdate.LoanId;
            loan.LoanDate = loanUpdate.LoanDate;
            loan.LoanPeriodMonths = loanUpdate.LoanPeriodMonths;
            loan.RepaymentDate = loan.LoanDate.AddMonths(loan.LoanPeriodMonths);
            loan.LoanAmountCzk = loanUpdate.LoanAmountCzk;
            loan.InterestRate = loanUpdate.InterestRate;

            var daysUpdate = (loan.RepaymentDate - loan.LoanDate).Days;
            var interestFactorUpdate = 1 + ((loan.InterestRate / 100m) * daysUpdate / 365m);
            loan.RepaymentAmountCzk = loan.LoanAmountCzk * interestFactorUpdate;
            
            var currentPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            
            // Calculate FireFish fees in BTC
            loan.FeesBtc = loanUpdate.FeesBtc;
                
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            loan.TransactionFeesBtc = loanUpdate.TransactionFeesBtc;
            
            // Update collateral
            if (loanUpdate.CollateralBtc > 0)
                loan.CollateralBtc = loanUpdate.CollateralBtc;
            else if (user?.LtvPercent > 0 && currentPrice > 0) // Avoid division by zero
                loan.CollateralBtc = loan.LoanAmountCzk / currentPrice * (100m / user.LtvPercent);
                
            // Recalculate total BTC sent
            loan.TotalSentBtc = loan.CollateralBtc + loan.TransactionFeesBtc + loan.FeesBtc;
            loan.PurchasedBtc = loanUpdate.PurchasedBtc;

            loan.Status = loanUpdate.Status;
            loan.StrategyJson = loanUpdate.StrategyJson; // Update strategy JSON
            loan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(); // Save basic loan updates first
             _logger.LogInformation("[Loan {LoanId}] Basic loan properties updated.", loanId);

            // --- Regenerate planned orders if strategy changed and is applicable ---
            if (!string.IsNullOrEmpty(loan.StrategyJson))
            {
                 _logger.LogInformation("[Loan {LoanId}] Strategy changed and is not empty. Attempting to regenerate planned orders.", loanId);
                 // Reload loan with orders to ensure we have the latest state
                var loanWithOrders = await _context.Loans
                                         .Include(l => l.SellOrders)
                                         .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

                if (loanWithOrders != null)
                {
                    try
                    {
                        var strategy = JsonConvert.DeserializeObject<ExitStrategyBase>(loan.StrategyJson, new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.Auto });
                        if (strategy == null)
                        {
                             _logger.LogWarning("[Loan {LoanId}] Failed to deserialize strategy JSON: {StrategyJson}", loanId, loan.StrategyJson);
                        }
                        else if (strategy is CustomLadderExitStrategy || strategy is SmartDistributionExitStrategy || strategy is EquidistantLadderExitStrategy || strategy is EquifrequentLadderExitStrategy)
                        {
                            _logger.LogInformation("[Loan {LoanId}] Strategy type is {StrategyType}. Calling GeneratePlannedSellOrdersAsync.", loanId, strategy.GetType().Name);
                            await GeneratePlannedSellOrdersAsync(loanWithOrders, strategy);
                        }
                        else // If strategy is HODL or other type, remove existing planned orders
                        {
                             _logger.LogInformation("[Loan {LoanId}] Strategy type is {StrategyType}. Calling RemovePlannedSellOrdersAsync.", loanId, strategy.GetType().Name);
                             await RemovePlannedSellOrdersAsync(loanWithOrders);
                             // Need to save changes after removal if strategy is not applicable for generation
                             await _context.SaveChangesAsync();
                             _logger.LogInformation("[Loan {LoanId}] Saved changes after removing planned orders for non-applicable strategy.", loanId);
                        }
                    }
                    catch(Exception ex)
                    {
                         _logger.LogError(ex, "[Loan {LoanId}] Error during strategy deserialization or order generation trigger.", loanId);
                    }
                }
                else
                {
                    _logger.LogWarning("[Loan {LoanId}] Could not reload loan with orders after update.", loanId);
                }
            }
            else if (strategyChanged && string.IsNullOrEmpty(loan.StrategyJson))
            {
                 // Strategy was removed (set to HODL or empty)
                 _logger.LogInformation("[Loan {LoanId}] Strategy was removed or set to HODL. Attempting to remove existing planned orders.", loanId);
                 var loanWithOrders = await _context.Loans.Include(l => l.SellOrders).FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);
                 if(loanWithOrders != null)
                 {
                    await RemovePlannedSellOrdersAsync(loanWithOrders);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("[Loan {LoanId}] Saved changes after removing planned orders due to strategy removal.", loanId);
                 }
            }

            _logger.LogInformation("Finished UpdateLoanAsync for loan {LoanId}", loan.Id);

            // Return the potentially updated loan
            return await _context.Loans
                           .Include(l => l.SellOrders)
                           .AsNoTracking()
                           .FirstAsync(l => l.Id == loanId);
        }

        /// <summary>
        /// Gets all loans for a user
        /// </summary>
        public async Task<IEnumerable<Loan>> GetUserLoansAsync(string userId)
        {
            var loans = await _context.Loans
                .Where(l => l.UserId == userId)
                .Include(l => l.SellOrders)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
                
            
            return loans;
        }

        /// <summary>
        /// Gets a specific loan by ID for a user
        /// </summary>
        public async Task<Loan> GetLoanAsync(string userId, int loanId)
        {
            var loan = await _context.Loans
                .Include(l => l.SellOrders)
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
            {
                _logger.LogWarning("Loan {LoanId} not found for user {UserId}", loanId, userId);
                throw new KeyNotFoundException($"Loan {loanId} not found");
            }
            
            if (loan.SellOrders == null)
            {
                loan.SellOrders = new List<SellOrder>();
            }

            
            return loan;
        }

        /// <summary>
        /// Deletes a loan
        /// </summary>
        public async Task DeleteLoanAsync(string userId, int loanId)
        {
            var loan = await _context.Loans
                .Include(l => l.SellOrders) // Include orders to ensure cascade delete if configured, or handle manually
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
            {
                _logger.LogWarning("Loan {LoanId} not found for user {UserId} during deletion", loanId, userId);
                throw new KeyNotFoundException($"Loan {loanId} not found");
            }

            // Optionally handle related entities like SellOrders if cascade delete is not set up
            // _context.SellOrders.RemoveRange(loan.SellOrders);

            _context.Loans.Remove(loan);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Deleted loan {LoanId} for user {UserId}", loanId, userId);
        }

        public async Task<bool> OpenSellOrderAsync(string userId, int orderId)
        {
            var order = await _context.SellOrders.Include(o => o.Loan).FirstOrDefaultAsync(o => o.Id == orderId && o.Loan.UserId == userId);
            if (order == null || order.Status != SellOrderStatus.Planned)
                return false;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.CoinmateApiKey == null || user?.CoinmateApiSecret == null) {
                 _logger.LogWarning("Coinmate API keys missing for user {UserId} when trying to open order {OrderId}", userId, orderId);
                return false; // Or throw specific exception
            }
            // Vytvoř order na Coinmate
            var coinmateOrderId = await _coinmateService.PlaceSellOrderAsync(
                user.Id,
                user.CoinmateApiKey,
                user.CoinmateApiSecret,
                order.BtcAmount,
                order.PricePerBtc
            );
            if (string.IsNullOrEmpty(coinmateOrderId)) {
                _logger.LogError("Failed to place sell order {OrderId} on Coinmate for user {UserId}", orderId, userId);
                order.Status = SellOrderStatus.Failed; // Mark as failed if Coinmate call fails
                await _context.SaveChangesAsync();
                return false;
            }
            order.CoinmateOrderId = coinmateOrderId;
            order.Status = SellOrderStatus.Submitted;
            await _context.SaveChangesAsync();
             _logger.LogInformation("Successfully opened sell order {OrderId} (Coinmate ID: {CoinmateOrderId}) for user {UserId}", orderId, coinmateOrderId, userId);
            return true;
        }

        public async Task<bool> CancelSellOrderAsync(string userId, int orderId)
        {
            var order = await _context.SellOrders.Include(o => o.Loan).FirstOrDefaultAsync(o => o.Id == orderId && o.Loan.UserId == userId);
             if (order == null || string.IsNullOrEmpty(order.CoinmateOrderId) || order.Status != SellOrderStatus.Submitted) {
                 _logger.LogWarning("Cannot cancel order {OrderId} for user {UserId}. Status: {Status}, CoinmateOrderId: {CoinmateOrderId}",
                    orderId, userId, order?.Status, order?.CoinmateOrderId ?? "null");
                return false;
            }
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
             if (user?.CoinmateApiKey == null || user?.CoinmateApiSecret == null) {
                 _logger.LogWarning("Coinmate API keys missing for user {UserId} when trying to cancel order {OrderId}", userId, orderId);
                return false;
            }
            // Zruš order na Coinmate
            var result = await _coinmateService.CancelSellOrderAsync(
                user.Id,
                user.CoinmateApiKey,
                user.CoinmateApiSecret,
                order.CoinmateOrderId
            );
            if (!result) {
                 _logger.LogError("Failed to cancel sell order {OrderId} (Coinmate ID: {CoinmateOrderId}) on Coinmate for user {UserId}",
                     orderId, order.CoinmateOrderId, userId);
                // Should we mark as failed or leave as Submitted? Depends on desired behavior.
                return false;
            }
             _logger.LogInformation("Successfully cancelled sell order {OrderId} (Coinmate ID: {CoinmateOrderId}) for user {UserId}",
                 orderId, order.CoinmateOrderId, userId);
            order.CoinmateOrderId = null; // Clear Coinmate ID
            order.Status = SellOrderStatus.Cancelled; // Mark as Cancelled
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task SyncSellOrdersAsync(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.CoinmateApiKey == null || user?.CoinmateApiSecret == null)
            {
                _logger.LogWarning("Coinmate API keys missing for user {UserId}. Cannot sync orders.", userId);
                return;
            }

            var ordersToSync = await _context.SellOrders
                .Include(o => o.Loan)
                .Where(o => o.Loan.UserId == userId &&
                             !string.IsNullOrEmpty(o.CoinmateOrderId) &&
                             (o.Status == SellOrderStatus.Submitted || o.Status == SellOrderStatus.PartiallyFilled))
                .ToListAsync();

             _logger.LogInformation("Starting order sync for user {UserId}. Found {OrderCount} orders to check.", userId, ordersToSync.Count);

            foreach (var order in ordersToSync)
            {
                try
                {
                    var coinmateStatus = await _coinmateService.GetSellOrderStatusAsync(
                        user.Id,
                        user.CoinmateApiKey,
                        user.CoinmateApiSecret,
                        order.CoinmateOrderId ?? string.Empty
                    );

                    // Check if status was retrieved and is different
                    if (coinmateStatus.HasValue && order.Status != coinmateStatus.Value)
                    {
                        _logger.LogInformation("Syncing order {OrderId} (Coinmate ID: {CoinmateOrderId}) for user {UserId}. Old status: {OldStatus}, New status: {NewStatus}",
                                             order.Id, order.CoinmateOrderId, userId, order.Status, coinmateStatus.Value);

                        order.Status = coinmateStatus.Value;

                        // Set completion time if just completed
                        if (coinmateStatus.Value == SellOrderStatus.Completed && order.CompletedAt == null)
                        {
                            order.CompletedAt = DateTime.UtcNow;
                        }
                    }
                    else if (!coinmateStatus.HasValue)
                    {
                        _logger.LogWarning("Could not get status for order {OrderId} (Coinmate ID: {CoinmateOrderId}) from Coinmate.", order.Id, order.CoinmateOrderId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error syncing order {OrderId} (Coinmate ID: {CoinmateOrderId}) for user {UserId}", order.Id, order.CoinmateOrderId, userId);
                }
                await Task.Delay(100); // Keep delay
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Finished order sync for user {UserId}.", userId);
        }

        // --- Private Helper Methods ---

        /// <summary>
        /// Removes all SellOrders with 'Planned' status for a given loan.
        /// </summary>
        private async Task RemovePlannedSellOrdersAsync(Loan loan)
        {
             if (loan.SellOrders == null || !loan.SellOrders.Any()) {
                 _logger.LogInformation("[Loan {LoanId}] No existing sell orders found to remove.", loan.Id);
                 return;
             }

            var plannedOrders = loan.SellOrders.Where(o => o.Status == SellOrderStatus.Planned).ToList();
            if (plannedOrders.Any())
            {
                _logger.LogInformation("[Loan {LoanId}] Removing {Count} existing planned sell orders.", loan.Id, plannedOrders.Count);
                _context.SellOrders.RemoveRange(plannedOrders);
                // SaveChanges is called by the caller (GeneratePlannedSellOrdersAsync or UpdateLoanAsync)
            }
             else
            {
                 _logger.LogInformation("[Loan {LoanId}] No planned sell orders found to remove.", loan.Id);
             }
        }


        /// <summary>
        /// Generates and saves planned SellOrders based on the provided exit strategy.
        /// </summary>
        private async Task GeneratePlannedSellOrdersAsync(Loan loan, ExitStrategyBase strategy)
        {
            _logger.LogInformation("[Loan {LoanId}] Starting GeneratePlannedSellOrdersAsync for strategy {StrategyType}.", loan.Id, strategy.GetType().Name);
            if (loan == null) throw new ArgumentNullException(nameof(loan));
            if (strategy == null) throw new ArgumentNullException(nameof(strategy));

             if (loan.SellOrders == null) {
                 _logger.LogWarning("[Loan {LoanId}] SellOrders collection was null. Reloading.", loan.Id);
                 loan = await _context.Loans.Include(l => l.SellOrders).FirstAsync(l => l.Id == loan.Id);
             }

            // 1. Remove existing planned orders
             _logger.LogInformation("[Loan {LoanId}] Calling RemovePlannedSellOrdersAsync before generation.", loan.Id);
            await RemovePlannedSellOrdersAsync(loan);

            // 2. Get current BTC price for strategy generation
            var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            if (currentBtcPrice <= 0) {
                _logger.LogError("[Loan {LoanId}] Could not get current BTC price. Aborting order generation.", loan.Id);
                await _context.SaveChangesAsync();
                _logger.LogInformation("[Loan {LoanId}] Saved context after failing to get BTC price.", loan.Id);
                return;
            }
            _logger.LogInformation("[Loan {LoanId}] Current BTC price: {CurrentPrice}", loan.Id, currentBtcPrice);

            // 3. Generate new orders using ExitStrategyService
            try
            {
                _logger.LogInformation("[Loan {LoanId}] Using ExitStrategyService to generate orders for strategy {StrategyType}.", loan.Id, strategy.GetType().Name);
                var newOrders = _exitStrategyService.GenerateSellOrders(loan, strategy, currentBtcPrice);
                
                if (newOrders.Any())
                {
                    _logger.LogInformation("[Loan {LoanId}] Generated {Count} orders using ExitStrategyService.", loan.Id, newOrders.Count);
                    
                    // Set creation time for all orders
                    DateTime now = DateTime.UtcNow;
                    foreach (var order in newOrders)
                    {
                        order.CreatedAt = now;
                    }
                    
                    // Add new orders to context
                    _context.SellOrders.AddRange(newOrders);
                }
                else
                {
                    _logger.LogInformation("[Loan {LoanId}] No orders were generated by ExitStrategyService.", loan.Id);
                }
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "[Loan {LoanId}] Error during order generation using ExitStrategyService for strategy {StrategyType}.", loan.Id, strategy.GetType().Name);
                 await _context.SaveChangesAsync(); // Save removal of old orders
                 _logger.LogInformation("[Loan {LoanId}] Saved context after exception during order generation.", loan.Id);
                 return;
            }

            // 4. Save changes (includes removal of old orders and addition of new ones)
            try
            {
                 _logger.LogInformation("[Loan {LoanId}] Attempting to save changes to database (planned orders).", loan.Id);
                await _context.SaveChangesAsync();
                _logger.LogInformation("[Loan {LoanId}] Successfully saved changes for planned orders.", loan.Id);
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "[Loan {LoanId}] Error saving planned orders to database.", loan.Id);
                 throw;
            }
        }
    }
}
