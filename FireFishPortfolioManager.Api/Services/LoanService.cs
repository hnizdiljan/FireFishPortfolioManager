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
            
            // Calculate the repayment with fees in BTC
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

            // Update loan properties
            loan.LoanId = loanUpdate.LoanId;
            loan.LoanDate = loanUpdate.LoanDate;
            loan.RepaymentDate = loanUpdate.RepaymentDate;
            loan.Status = loanUpdate.Status;
            loan.LoanAmountCzk = loanUpdate.LoanAmountCzk;
            loan.InterestRate = loanUpdate.InterestRate;
            loan.RepaymentAmountCzk = loanUpdate.RepaymentAmountCzk;
            loan.FeesBtc = loanUpdate.FeesBtc;
            loan.TransactionFeesBtc = loanUpdate.TransactionFeesBtc;
            loan.CollateralBtc = loanUpdate.CollateralBtc;
            loan.TotalSentBtc = loanUpdate.TotalSentBtc;
            loan.PurchasedBtc = loanUpdate.PurchasedBtc;
            
            // Get the current BTC price and recalculate repayment
            loan.CurrentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            loan.RepaymentWithFeesBtc = _calculationService.CalculateRequiredBtcForRepayment(loan, loan.CurrentBtcPrice);
            
            // Update profit strategy settings
            loan.TargetProfitPercentage = loanUpdate.TargetProfitPercentage;
            loan.MaxSellOrders = loanUpdate.MaxSellOrders;
            loan.MinSellOrderSize = loanUpdate.MinSellOrderSize;
            loan.TotalTargetProfitPercentage = loanUpdate.TotalTargetProfitPercentage;
            loan.WithdrawalWalletAddress = loanUpdate.WithdrawalWalletAddress;
            
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

            // Basic viability check (needs refinement)
            if (loan.PurchasedBtc > requiredBtcForRepayment && loan.TargetProfitPercentage > 0)
            {
                isViable = true; 
                // Calculate target price based on profit percentage
                var targetPrice = currentBtcPrice * (1 + loan.TargetProfitPercentage / 100m); 
                
                // Simple strategy: one sell order for the required BTC at target price
                sellOrders.Add(new SellStrategyOrder
                {
                    BtcAmount = requiredBtcForRepayment, // Or split into smaller orders
                    PricePerBtc = targetPrice,
                    TotalCzk = requiredBtcForRepayment * targetPrice
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
                strategy);
            
            // Add created orders to the context and save changes
            if (createdOrders.Any())
            {
                _context.SellOrders.AddRange(createdOrders);
                loan.Status = LoanStatus.Active; // Set status to Active
                loan.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully submitted {OrderCount} sell orders for loan {LoanId}", createdOrders.Count, loanId);
            }
            
            return createdOrders;
        }
    }
}
