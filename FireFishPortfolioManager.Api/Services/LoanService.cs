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
                        else if (strategy is CustomLadderExitStrategy || strategy is SmartDistributionExitStrategy)
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

            // 2. Calculate total available BTC for the strategy (formerly sellableBtc)
            decimal purchasedBtc = loan.PurchasedBtc;
            decimal feesBtc = loan.FeesBtc;
            decimal transactionFeesBtc = loan.TransactionFeesBtc;
            decimal totalAvailableBtcForStrategy = purchasedBtc - feesBtc - transactionFeesBtc;
            _logger.LogInformation("[Loan {LoanId}] Calculated totalAvailableBtcForStrategy: {TotalAvailableBtc} (Purchased: {PurchasedBtc}, Fees: {FeesBtc}, TxFees: {TxFees})",
                                 loan.Id, totalAvailableBtcForStrategy, purchasedBtc, feesBtc, transactionFeesBtc);

            if (totalAvailableBtcForStrategy <= 0.00000001m) // Use a small threshold
            {
                _logger.LogWarning("[Loan {LoanId}] totalAvailableBtcForStrategy is too low ({TotalAvailableBtc}). Skipping order generation.", loan.Id, totalAvailableBtcForStrategy);
                await _context.SaveChangesAsync(); // Save changes from order removal
                _logger.LogInformation("[Loan {LoanId}] Saved context after removing orders (totalAvailableBtcForStrategy was too low).", loan.Id);
                return;
            }

            var newOrders = new List<SellOrder>();
            DateTime now = DateTime.UtcNow;

            // 3. Generate new orders based on strategy type
            try
            {
                if (strategy is CustomLadderExitStrategy customLadder && customLadder.Orders != null)
                {
                    _logger.LogInformation("[Loan {LoanId}] Generating orders for CustomLadder with {OrderCount} definitions.", loan.Id, customLadder.Orders.Count);
                    decimal accumulatedPercent = 0m;
                    int generatedCount = 0;
                    foreach (var orderDef in customLadder.Orders.OrderBy(o => o.TargetPriceCzk))
                    {
                        decimal percentToUse = Math.Min(orderDef.PercentToSell, 100m - accumulatedPercent);
                        if (percentToUse <= 0) continue;

                        decimal btcAmount = totalAvailableBtcForStrategy * (percentToUse / 100m); // Using totalAvailableBtcForStrategy here
                         _logger.LogDebug("[Loan {LoanId}] CustomLadder Order Def: Price={Price}, Percent={Percent}, PercentToUse={PercentToUse}, Calculated BtcAmount={BtcAmount}",
                                       loan.Id, orderDef.TargetPriceCzk, orderDef.PercentToSell, percentToUse, btcAmount);

                        if (btcAmount < 0.00000001m) {
                             _logger.LogWarning("[Loan {LoanId}] Skipping CustomLadder order for price {Price} due to low BTC amount: {BtcAmount}", loan.Id, orderDef.TargetPriceCzk, btcAmount);
                             continue;
                        }

                        newOrders.Add(new SellOrder
                        {
                            LoanId = loan.Id,
                            BtcAmount = btcAmount,
                            PricePerBtc = orderDef.TargetPriceCzk,
                            TotalCzk = btcAmount * orderDef.TargetPriceCzk,
                            Status = SellOrderStatus.Planned,
                            CreatedAt = now
                        });
                        generatedCount++;
                        accumulatedPercent += percentToUse;
                        if (accumulatedPercent >= 100m) break;
                    }
                    _logger.LogInformation("[Loan {LoanId}] Generated {Count} planned orders for CustomLadder strategy.", loan.Id, generatedCount);
                }
                else if (strategy is SmartDistributionExitStrategy smartDist)
                {
                     _logger.LogInformation("[Loan {LoanId}] Generating orders for SmartDistribution: TargetProfit={Profit}%, OrderCount={Count}, BtcProfitRatio={Ratio}%",
                                         loan.Id, smartDist.TargetProfitPercent, smartDist.OrderCount, smartDist.BtcProfitRatioPercent);

                    var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
                    if (currentBtcPrice <= 0) {
                        _logger.LogError("[Loan {LoanId}] Could not get current BTC price. Aborting SmartDistribution order generation.", loan.Id);
                        await _context.SaveChangesAsync();
                         _logger.LogInformation("[Loan {LoanId}] Saved context after failing to get BTC price for SmartDist.", loan.Id);
                        return;
                    }
                     _logger.LogInformation("[Loan {LoanId}] Current BTC price for SmartDistribution: {CurrentPrice}", loan.Id, currentBtcPrice);

                    // Základní výpočty
                    decimal repaymentCzk = loan.RepaymentAmountCzk;
                    decimal targetTotalValueCzk = repaymentCzk * (1 + smartDist.TargetProfitPercent / 100m);
                    decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;
                    
                    _logger.LogInformation("[Loan {LoanId}] Target values: Total={TargetValue} CZK, Repayment={Repayment} CZK, Profit={Profit} CZK",
                                         loan.Id, targetTotalValueCzk, repaymentCzk, totalProfitCzk);

                    // Výpočet kolik zisku má být v CZK (ze sell orderů) vs kolik v BTC
                    decimal profitFromCzk = totalProfitCzk * (1 - smartDist.BtcProfitRatioPercent / 100m);
                    
                    // KLÍČOVÁ OPRAVA: Sell ordery mají generovat pouze: repayment + profit který má být v CZK
                    // Pokud je BtcProfitRatioPercent = 100%, pak profitFromCzk = 0, a sell ordery pokryjí pouze repayment
                    decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
                    
                    _logger.LogInformation("[Loan {LoanId}] Profit distribution: TotalProfit={TotalProfit} CZK, ProfitFromCZK={ProfitCzk} CZK ({CzkPercent:F1}%), ProfitFromBTC={ProfitBtc} CZK ({BtcPercent:F1}%)",
                                         loan.Id, totalProfitCzk, profitFromCzk, (1 - smartDist.BtcProfitRatioPercent / 100m) * 100m, 
                                         totalProfitCzk - profitFromCzk, smartDist.BtcProfitRatioPercent);
                    
                    _logger.LogInformation("[Loan {LoanId}] Sell orders target value: {TargetValue} CZK (Repayment: {Repayment} + CZK Profit: {CzkProfit})",
                                         loan.Id, targetCzkFromSellOrders, repaymentCzk, profitFromCzk);

                    // Odhad kolik BTC potřebujeme na sell ordery (při současné ceně jako aproximace)
                    decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
                    
                    // Zajistit, že nemáme více BTC na sell ordery než je dostupné
                    decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtcForStrategy * 0.99m); // Max 99% pro bezpečnost
                    decimal btcToKeepAsProfit = totalAvailableBtcForStrategy - btcForSellOrders;
                    
                    // Ověření logiky
                    decimal estimatedValueFromBtcProfit = btcToKeepAsProfit * currentBtcPrice;
                    decimal estimatedTotalValue = targetCzkFromSellOrders + estimatedValueFromBtcProfit;
                    
                    _logger.LogInformation("[Loan {LoanId}] BTC allocation check:", loan.Id);
                    _logger.LogInformation("  - Total available BTC: {TotalBtc} BTC", totalAvailableBtcForStrategy);
                    _logger.LogInformation("  - BTC for sell orders: {SellBtc} BTC (estimated value: {SellValue} CZK)", btcForSellOrders, targetCzkFromSellOrders);
                    _logger.LogInformation("  - BTC to keep as profit: {ProfitBtc} BTC (estimated value at current price: {ProfitValue} CZK)", btcToKeepAsProfit, estimatedValueFromBtcProfit);
                    _logger.LogInformation("  - Estimated total value: {EstimatedTotal} CZK (target: {TargetTotal} CZK)", estimatedTotalValue, targetTotalValueCzk);
                    
                    if (btcForSellOrders <= 0.00000001m)
                    {
                        _logger.LogWarning("[Loan {LoanId}] btcForSellOrders is too low ({BtcAmount}). Skipping order generation.", loan.Id, btcForSellOrders);
                        await _context.SaveChangesAsync();
                        return;
                    }

                    int orderCount = Math.Max(1, smartDist.OrderCount);
                    decimal btcPerOrder = btcForSellOrders / orderCount;

                    // Výpočet cenového rozsahu
                    // Potřebujeme ceny tak, aby průměrná cena = targetCzkFromSellOrders / btcForSellOrders
                    decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
                    
                    // Vytvoření cenového rozsahu kolem průměrné ceny
                    decimal priceSpreadPercent = 0.4m; // +/-40% rozptyl kolem průměru
                    decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
                    decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
                    
                    // Zajistit rozumné minimální ceny
                    minPrice = Math.Max(minPrice, currentBtcPrice * 1.05m); // Min +5% nad současnou cenu
                    maxPrice = Math.Max(maxPrice, minPrice * 1.2m); // Min 20% rozptyl
                    
                    // Přepočítání průměru po úpravě minimální ceny
                    decimal actualAvgPrice = (minPrice + maxPrice) / 2m;
                    
                    _logger.LogInformation("[Loan {LoanId}] Price calculation: Target avg={TargetAvg}, Actual avg={ActualAvg}, Min={Min}, Max={Max}, Current={Current}",
                                         loan.Id, targetAvgPrice, actualAvgPrice, minPrice, maxPrice, currentBtcPrice);

                    // Generování orderů
                    int generatedCount = 0;
                    for (int i = 0; i < orderCount; i++)
                    {
                        decimal priceMultiplier = orderCount == 1 ? 0.5m : (decimal)i / (orderCount - 1);
                        decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
                        
                        // Zaokrouhlení na tisíce
                        orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                        orderPrice = Math.Max(orderPrice, currentBtcPrice * 1.05m);

                        decimal actualBtcAmount = (i == orderCount - 1)
                            ? btcForSellOrders - newOrders.Sum(o => o.BtcAmount) // Poslední order bere zbytek
                            : btcPerOrder;
                            
                        actualBtcAmount = Math.Max(0m, actualBtcAmount);

                        if (actualBtcAmount <= 0.00000001m) {
                             _logger.LogWarning("[Loan {LoanId}] Skipping order {Index} due to low BTC amount: {Amount}", loan.Id, i, actualBtcAmount);
                            continue;
                        }

                        newOrders.Add(new SellOrder
                        {
                            LoanId = loan.Id,
                            BtcAmount = actualBtcAmount,
                            PricePerBtc = orderPrice,
                            TotalCzk = actualBtcAmount * orderPrice,
                            Status = SellOrderStatus.Planned,
                            CreatedAt = now
                        });
                        generatedCount++;
                        
                        _logger.LogDebug("[Loan {LoanId}] Generated order {Index}: {BtcAmount} BTC @ {Price} CZK = {Total} CZK",
                                       loan.Id, i, actualBtcAmount, orderPrice, actualBtcAmount * orderPrice);
                    }

                    // Detailní ověření výsledku
                    if (newOrders.Any())
                    {
                        decimal actualTotalFromOrders = newOrders.Sum(o => o.TotalCzk);
                        decimal highestPrice = newOrders.Max(o => o.PricePerBtc);
                        decimal valueOfRemainingBtc = btcToKeepAsProfit * highestPrice;
                        decimal actualTotalValue = actualTotalFromOrders + valueOfRemainingBtc;
                        
                        // Výpočet expectedProfitFromBtc na základě nejvyšší ceny
                        decimal expectedProfitFromBtc = totalProfitCzk * (smartDist.BtcProfitRatioPercent / 100m);
                        decimal expectedProfitFromBtcAtHighestPrice = btcToKeepAsProfit * highestPrice;
                        
                        _logger.LogInformation("[Loan {LoanId}] === SmartDistribution FINAL VERIFICATION ===", loan.Id);
                        _logger.LogInformation("[Loan {LoanId}] SELL ORDERS:", loan.Id);
                        _logger.LogInformation("  - Target: {TargetFromOrders} CZK (Repayment: {Repayment} + CZK Profit: {CzkProfit})", targetCzkFromSellOrders, repaymentCzk, profitFromCzk);
                        _logger.LogInformation("  - Actual: {ActualFromOrders} CZK", actualTotalFromOrders);
                        _logger.LogInformation("  - Difference: {Difference} CZK ({DifferencePercent:F2}%)", actualTotalFromOrders - targetCzkFromSellOrders, (actualTotalFromOrders - targetCzkFromSellOrders) / targetCzkFromSellOrders * 100m);
                        
                        _logger.LogInformation("[Loan {LoanId}] BTC PROFIT:", loan.Id);
                        _logger.LogInformation("  - Remaining BTC: {RemainingBtc} BTC", btcToKeepAsProfit);
                        _logger.LogInformation("  - Value at highest price ({HighestPrice} CZK): {RemainingValue} CZK", highestPrice, valueOfRemainingBtc);
                        _logger.LogInformation("  - Expected BTC profit: {ExpectedBtcProfit} CZK ({BtcProfitPercent:F1}% of total profit)", expectedProfitFromBtc, smartDist.BtcProfitRatioPercent);
                        
                        _logger.LogInformation("[Loan {LoanId}] TOTAL VALUES:", loan.Id);
                        _logger.LogInformation("  - Target total value: {TargetTotal} CZK", targetTotalValueCzk);
                        _logger.LogInformation("  - Actual total value: {ActualTotal} CZK", actualTotalValue);
                        _logger.LogInformation("  - Difference: {TotalDifference} CZK ({TotalDifferencePercent:F2}%)", actualTotalValue - targetTotalValueCzk, (actualTotalValue - targetTotalValueCzk) / targetTotalValueCzk * 100m);
                        
                        _logger.LogInformation("[Loan {LoanId}] REPAYMENT COVERAGE:", loan.Id);
                        _logger.LogInformation("  - Repayment amount: {Repayment} CZK", repaymentCzk);
                        _logger.LogInformation("  - Covered by sell orders: {Coverage:F2}% ({ActualOrders} / {Repayment})", (actualTotalFromOrders / repaymentCzk) * 100m, actualTotalFromOrders, repaymentCzk);
                        
                        // KRITICKÉ VAROVÁNÍ pokud sell ordery nepokrývají repayment při 100% BTC profit
                        if (smartDist.BtcProfitRatioPercent >= 99.9m && actualTotalFromOrders < repaymentCzk)
                        {
                            _logger.LogError("[Loan {LoanId}] CRITICAL ERROR: BTC profit ratio is {BtcRatio}% but sell orders ({SellTotal}) don't cover repayment ({Repayment})!", 
                                           loan.Id, smartDist.BtcProfitRatioPercent, actualTotalFromOrders, repaymentCzk);
                        }
                    }
                    
                    _logger.LogInformation("[Loan {LoanId}] Generated {Count} planned orders for SmartDistribution strategy.", loan.Id, generatedCount);
                }
                else
                {
                    _logger.LogWarning("[Loan {LoanId}] Strategy type {StrategyType} is not CustomLadder or SmartDistribution inside GeneratePlannedSellOrdersAsync. This should not happen.", loan.Id, strategy.GetType().Name);
                }
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "[Loan {LoanId}] Error during generation logic for strategy {StrategyType}.", loan.Id, strategy.GetType().Name);
                 // Don't save potentially partial changes if generation failed mid-way
                 // Changes from RemovePlannedSellOrdersAsync might already be staged, consider transaction scoping if needed.
                 // For now, we attempt to save whatever was staged before the exception.
                 await _context.SaveChangesAsync();
                 _logger.LogInformation("[Loan {LoanId}] Saved context after exception during order generation.", loan.Id);
                 return; // Exit after logging error
            }

            // 4. Add new orders
            if (newOrders.Any())
            {
                _logger.LogInformation("[Loan {LoanId}] Adding {Count} newly generated planned orders to context.", loan.Id, newOrders.Count);
                _context.SellOrders.AddRange(newOrders);
            }
            else
            {
                 _logger.LogInformation("[Loan {LoanId}] No new planned orders were generated.", loan.Id);
            }

            // 5. Save changes (includes removal of old orders and addition of new ones)
            try
            {
                 _logger.LogInformation("[Loan {LoanId}] Attempting to save changes to database (planned orders).", loan.Id);
                await _context.SaveChangesAsync();
                _logger.LogInformation("[Loan {LoanId}] Successfully saved changes for planned orders.", loan.Id);
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "[Loan {LoanId}] Error saving planned orders to database.", loan.Id);
                 // Rethrow or handle as appropriate
                 throw;
            }
        }
    }
}
