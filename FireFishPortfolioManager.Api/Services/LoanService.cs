using FireFishPortfolioManager.Api.Data;
using FireFishPortfolioManager.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FireFishPortfolioManager.Api.Services
{
    public class LoanService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoanService> _logger;
        private readonly CoinmateService _coinmateService;
        private readonly PortfolioCalculationService _calculationService;

        public LoanService(
            ApplicationDbContext context,
            ILogger<LoanService> logger,
            CoinmateService coinmateService,
            PortfolioCalculationService calculationService)
        {
            _context = context;
            _logger = logger;
            _coinmateService = coinmateService;
            _calculationService = calculationService;
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
            loan.CurrentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            
            // Use default status of Active for new loans
            if (loan.Status == default)
                loan.Status = LoanStatus.Active;
                
            // Calculate automatic fields: repayment date, amount, fees, collateral, total sent
            loan.RepaymentDate = loan.LoanDate.AddMonths(loan.LoanPeriodMonths);
            loan.RepaymentAmountCzk = loan.LoanAmountCzk * (1 + loan.InterestRate / 100m);
            
            // Get user for LTV settings
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            // Set default FireFish fee percent if not specified
            if (loan.FireFishFeePercent <= 0)
                loan.FireFishFeePercent = 1.5m; // Default to 1.5%
                
            // Calculate FireFish fees in BTC
            loan.FeesBtc = (loan.LoanAmountCzk * loan.FireFishFeePercent / 100m) / loan.CurrentBtcPrice;
            
            // Calculate collateral based on LTV if not specified
            if (loan.CollateralBtc <= 0 && user?.LtvPercent > 0)
                loan.CollateralBtc = loan.LoanAmountCzk / loan.CurrentBtcPrice * (100m / user.LtvPercent);
                
            // Calculate total BTC sent
            loan.TotalSentBtc = loan.CollateralBtc + loan.TransactionFeesBtc + loan.FeesBtc;
            
            // Set default Bitcoin profit ratio if not specified
            if (loan.BitcoinProfitRatio <= 0)
                loan.BitcoinProfitRatio = 50m; // Default to 50%
                
            loan.RepaymentWithFeesBtc = _calculationService.CalculateRequiredBtcForRepayment(loan, loan.CurrentBtcPrice);

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
            loan.FireFishFeePercent = loanUpdate.FireFishFeePercent > 0 ? loanUpdate.FireFishFeePercent : 1.5m;
            loan.RepaymentAmountCzk = loan.LoanAmountCzk * (1 + loan.InterestRate / 100m);
            
            var currentPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            loan.CurrentBtcPrice = currentPrice;
            
            // Calculate FireFish fees in BTC
            loan.FeesBtc = loanUpdate.FeesBtc > 0 ? loanUpdate.FeesBtc : 
                (loan.LoanAmountCzk * loan.FireFishFeePercent / 100m) / currentPrice;
                
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
            loan.TotalTargetProfitPercentage = loanUpdate.TotalTargetProfitPercentage;
            loan.BitcoinProfitRatio = loanUpdate.BitcoinProfitRatio > 0 ? loanUpdate.BitcoinProfitRatio : 50m;
            loan.Status = loanUpdate.Status;
            loan.UpdatedAt = DateTime.UtcNow;
            loan.RepaymentWithFeesBtc = _calculationService.CalculateRequiredBtcForRepayment(loan, loan.CurrentBtcPrice);

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
                
            // Update current BTC price and repayment calculations for all loans
            var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            
            foreach (var loan in loans)
            {
                loan.CurrentBtcPrice = currentBtcPrice;
                loan.RepaymentWithFeesBtc = _calculationService.CalculateRequiredBtcForRepayment(loan, currentBtcPrice);
            }
            
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
            
            // Update current BTC price and repayment calculation
            loan.CurrentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            loan.RepaymentWithFeesBtc = _calculationService.CalculateRequiredBtcForRepayment(loan, loan.CurrentBtcPrice);
            
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
            // Example logic - replace with actual strategy calculation
            // This should consider repayment amount, fees, target profit, purchased BTC, etc.
            var requiredBtcForRepayment = _calculationService.CalculateRequiredBtcForRepayment(loan, currentBtcPrice);
            var sellOrders = new List<SellStrategyOrder>();
            bool isViable = false;

            // Basic viability check using total profit percentage
            if (loan.PurchasedBtc > requiredBtcForRepayment && loan.TotalTargetProfitPercentage > 0)
            {
                isViable = true;
                // Calculate target price based on total profit percentage
                var targetPrice = currentBtcPrice * (1 + loan.TotalTargetProfitPercentage / 100m);
                
                // Use Bitcoin profit ratio to determine how much BTC to keep
                decimal btcToSell = requiredBtcForRepayment;
                decimal btcProfit = loan.PurchasedBtc - requiredBtcForRepayment;
                
                // Consider Bitcoin profit ratio: how much of the profit to keep in BTC
                if (loan.BitcoinProfitRatio > 0 && btcProfit > 0)
                {
                    decimal btcToKeep = btcProfit * (loan.BitcoinProfitRatio / 100m);
                    btcToSell = loan.PurchasedBtc - btcToKeep;
                }
                
                // Simple strategy: one sell order for the required BTC at target price
                sellOrders.Add(new SellStrategyOrder
                {
                    BtcAmount = btcToSell,
                    PricePerBtc = targetPrice,
                    TotalCzk = btcToSell * targetPrice
                });
            }

            return new SellStrategy { IsViable = isViable, SellOrders = sellOrders };
        }

        /// <summary>
        /// Generates a potential sell strategy for a loan
        /// </summary>
        public async Task<SellStrategy> GenerateSellStrategyAsync(string userId, int loanId)
        {
            var loan = await GetLoanAsync(userId, loanId); // Reuses existing method to ensure ownership and get loan
            var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            loan.CurrentBtcPrice = currentBtcPrice; // Update price for calculations
            
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
            loan.CurrentBtcPrice = currentBtcPrice; // Update price

            var strategy = GenerateSellStrategyInternal(loan, currentBtcPrice);
            
            if (!strategy.IsViable)
            {
                _logger.LogWarning("Sell strategy for loan {LoanId} is not viable.", loanId);
                return new List<SellOrder>(); // Return empty list if not viable
            }
            
            // Call CoinmateService with the User's credentials
            var createdOrders = await _coinmateService.ExecuteSellStrategyAsync(
                user.CoinmateApiKey, 
                user.CoinmateApiSecret, 
                loan, 
                strategy
            );
            
            // Add created orders to the context and save changes
            if (createdOrders.Any())
            {
                _context.SellOrders.AddRange(createdOrders);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created {OrderCount} sell orders for loan {LoanId}", createdOrders.Count, loanId);
            }
            
            return createdOrders;
        }
    }
}
