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
        /// Updates an existing loan
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
            else if (user?.LtvPercent > 0)
                loan.CollateralBtc = loan.LoanAmountCzk / currentPrice * (100m / user.LtvPercent);
                
            // Recalculate total BTC sent
            loan.TotalSentBtc = loan.CollateralBtc + loan.TransactionFeesBtc + loan.FeesBtc;
            loan.PurchasedBtc = loanUpdate.PurchasedBtc;

            loan.Status = loanUpdate.Status;
            loan.UpdatedAt = DateTime.UtcNow;


            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Updated loan {LoanId} for user {UserId}", loan.Id, userId);
            
            return loan;
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
                .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId);

            if (loan == null)
            {
                _logger.LogWarning("Loan {LoanId} not found for user {UserId} during deletion", loanId, userId);
                throw new KeyNotFoundException($"Loan {loanId} not found");
            }

            _context.Loans.Remove(loan);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Deleted loan {LoanId} for user {UserId}", loanId, userId);
        }

        /// <summary>
        /// Generates a sell strategy for a loan (internal helper)
        /// </summary>
        private SellStrategy GenerateSellStrategyInternal(Loan loan, decimal currentBtcPrice)
        {
            // Nově: použij ExitStrategyService pro generování orderů
            var sellOrders = _exitStrategyService.GenerateSellOrders(loan, currentBtcPrice);
            bool isViable = sellOrders != null && sellOrders.Count > 0;
            bool hasStrategySet = !string.IsNullOrEmpty(loan.StrategyJson);
            // Map SellOrder na SellStrategyOrder pro UI
            var strategyOrders = new List<SellStrategyOrder>();
            foreach (var o in sellOrders ?? [])
            {
                strategyOrders.Add(new SellStrategyOrder
                {
                    BtcAmount = o.BtcAmount,
                    PricePerBtc = o.PricePerBtc,
                    TotalCzk = o.TotalCzk
                });
            }
            return new SellStrategy { IsViable = isViable, SellOrders = strategyOrders, HasStrategySet = hasStrategySet };
        }

        /// <summary>
        /// Generates a potential sell strategy for a loan
        /// </summary>
        public async Task<SellStrategy> GenerateSellStrategyAsync(string userId, int loanId)
        {
            var loan = await GetLoanAsync(userId, loanId); // Reuses existing method to ensure ownership and get loan
            var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            
            return GenerateSellStrategyInternal(loan, currentBtcPrice);
        }

        /// <summary>
        /// Executes the sell strategy for a loan by placing orders on Coinmate
        /// </summary>
        public async Task<List<SellOrder>> ExecuteSellStrategyAsync(string userId, int loanId)
        {
            // Get User with credentials (keys will be decrypted here)
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                _logger.LogError("User {UserId} not found when executing sell strategy for loan {LoanId}", userId, loanId);
                throw new KeyNotFoundException("User not found");
            }
            if (string.IsNullOrEmpty(user.CoinmateApiKey) || string.IsNullOrEmpty(user.CoinmateApiSecret))
            {
                _logger.LogError("User {UserId} is missing Coinmate API credentials for loan {LoanId}", userId, loanId);
                throw new InvalidOperationException("Coinmate API credentials not configured for this user.");
            }

            var loan = await GetLoanAsync(userId, loanId); // Verify ownership and get loan details

            var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();

            var sellOrders = _exitStrategyService.GenerateSellOrders(loan, currentBtcPrice);
            if (sellOrders == null || sellOrders.Count == 0)
            {
                _logger.LogWarning("Sell strategy for loan {LoanId} is not viable.", loanId);
                return new List<SellOrder>();
            }
            // Call CoinmateService with the User's credentials
            var createdOrders = await _coinmateService.ExecuteSellStrategyAsync(
                user.CoinmateApiKey ?? string.Empty,
                user.CoinmateApiSecret ?? string.Empty,
                loan,
                new SellStrategy { IsViable = true, SellOrders = sellOrders.ConvertAll(o => new SellStrategyOrder
                {
                    BtcAmount = o.BtcAmount,
                    PricePerBtc = o.PricePerBtc,
                    TotalCzk = o.TotalCzk
                })
                }
            );
            if (createdOrders.Any())
            {
                _context.SellOrders.AddRange(createdOrders);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created {OrderCount} sell orders for loan {LoanId}", createdOrders.Count, loanId);
            }
            return createdOrders;
        }

        public async Task<bool> OpenSellOrderAsync(string userId, int orderId)
        {
            var order = await _context.SellOrders.Include(o => o.Loan).FirstOrDefaultAsync(o => o.Id == orderId && o.Loan.UserId == userId);
            if (order == null || order.Status != SellOrderStatus.Planned)
                return false;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return false;
            // Vytvoř order na Coinmate
            var coinmateOrderId = await _coinmateService.PlaceSellOrderAsync(
                user.Id,
                user.CoinmateApiKey ?? string.Empty,
                user.CoinmateApiSecret ?? string.Empty,
                order.BtcAmount,
                order.PricePerBtc
            );
            if (string.IsNullOrEmpty(coinmateOrderId))
                return false;
            order.CoinmateOrderId = coinmateOrderId;
            order.Status = SellOrderStatus.Submitted;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelSellOrderAsync(string userId, int orderId)
        {
            var order = await _context.SellOrders.Include(o => o.Loan).FirstOrDefaultAsync(o => o.Id == orderId && o.Loan.UserId == userId);
            if (order == null || order.Status != SellOrderStatus.Submitted)
                return false;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return false;
            // Zruš order na Coinmate
            var result = await _coinmateService.CancelSellOrderAsync(
                user.Id,
                user.CoinmateApiKey ?? string.Empty,
                user.CoinmateApiSecret ?? string.Empty,
                order.CoinmateOrderId ?? string.Empty
            );
            if (!result)
                return false;
            order.CoinmateOrderId = null;
            order.Status = SellOrderStatus.Planned;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task SyncSellOrdersAsync(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return;
            var orders = await _context.SellOrders.Include(o => o.Loan).Where(o => o.Loan.UserId == userId && !string.IsNullOrEmpty(o.CoinmateOrderId)).ToListAsync();
            foreach (var order in orders)
            {
                var status = await _coinmateService.GetSellOrderStatusAsync(
                    user.Id,
                    user.CoinmateApiKey ?? string.Empty,
                    user.CoinmateApiSecret ?? string.Empty,
                    order.CoinmateOrderId ?? string.Empty
                );
                if (status != null && order.Status != status.Value)
                {
                    order.Status = status.Value;
                    if (status.Value == SellOrderStatus.Completed || status.Value == SellOrderStatus.Cancelled || status.Value == SellOrderStatus.Failed)
                        order.CompletedAt = DateTime.UtcNow;
                }
            }
            await _context.SaveChangesAsync();
        }
    }
}
