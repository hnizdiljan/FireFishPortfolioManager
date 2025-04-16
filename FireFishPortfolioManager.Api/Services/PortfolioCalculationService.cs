using FireFishPortfolioManager.Api.Models;
using System;
using System.Threading.Tasks;

namespace FireFishPortfolioManager.Api.Services
{
    public class PortfolioCalculationService
    {
        // This service handles the core business logic for portfolio calculations
        
        /// <summary>
        /// Calculates the maximum loan amount based on allocated BTC and target LTV
        /// </summary>
        /// <param name="allocatedBtc">Amount of BTC allocated for the strategy</param>
        /// <param name="targetLtv">Target Loan-to-Value ratio (e.g., 0.5 for 50%)</param>
        /// <param name="currentBtcPriceCzk">Current BTC price in CZK</param>
        /// <returns>Maximum loan amount in CZK</returns>
        public decimal CalculateMaxLoanAmount(decimal allocatedBtc, decimal targetLtv, decimal currentBtcPriceCzk)
        {
            if (allocatedBtc <= 0)
                throw new ArgumentException("Allocated BTC must be greater than zero");
                
            if (targetLtv <= 0 || targetLtv >= 1)
                throw new ArgumentException("Target LTV must be between 0 and 1");
                
            if (currentBtcPriceCzk <= 0)
                throw new ArgumentException("BTC price must be greater than zero");
                
            // Calculate the maximum loan amount based on allocated BTC, target LTV, and current BTC price
            decimal btcValueInCzk = allocatedBtc * currentBtcPriceCzk;
            decimal maxLoanAmount = btcValueInCzk * targetLtv;
            
            return maxLoanAmount;
        }
        
        /// <summary>
        /// Calculates required BTC to repay the loan with fees
        /// </summary>
        /// <param name="loan">Loan information</param>
        /// <param name="currentBtcPriceCzk">Current BTC price in CZK</param>
        /// <returns>Amount of BTC required to repay the loan with fees</returns>
        public decimal CalculateRequiredBtcForRepayment(Loan loan, decimal currentBtcPriceCzk)
        {
            if (loan == null)
                throw new ArgumentNullException(nameof(loan));
                
            if (currentBtcPriceCzk <= 0)
                throw new ArgumentException("BTC price must be greater than zero");
            
            // Calculate how much BTC is needed to repay the loan amount plus fees
            decimal repaymentAmountInBtc = loan.RepaymentAmountCzk / currentBtcPriceCzk;
            decimal totalRequiredBtc = repaymentAmountInBtc + loan.FeesBtc + loan.TransactionFeesBtc;
            
            return totalRequiredBtc;
        }
        
        /// <summary>
        /// Generates a sell strategy based on user's profit target
        /// </summary>
        /// <param name="loan">Loan information</param>
        /// <param name="currentBtcPriceCzk">Current BTC price in CZK</param>
        /// <returns>Sell strategy with orders</returns>
        public async Task<SellStrategy> GenerateSellStrategyAsync(Loan loan, decimal currentBtcPriceCzk)
        {
            if (loan == null)
                throw new ArgumentNullException(nameof(loan));
                
            if (currentBtcPriceCzk <= 0)
                throw new ArgumentException("BTC price must be greater than zero");
                
            // Calculate the target sell price based on profit percentage
            decimal targetProfitMultiplier = 1 + (loan.TotalTargetProfitPercentage / 100);
            decimal targetSellPriceCzk = currentBtcPriceCzk * targetProfitMultiplier;
            
            // Calculate how much BTC we need to sell to cover the loan repayment and fees
            decimal btcToSellForRepayment = CalculateRequiredBtcForRepayment(loan, targetSellPriceCzk);
            
            // Calculate the remaining BTC after selling for repayment (profit)
            decimal remainingBtc = loan.PurchasedBtc - btcToSellForRepayment;
            
            // Create the sell strategy
            var strategy = new SellStrategy
            {
                LoanId = loan.Id,
                CurrentBtcPriceCzk = currentBtcPriceCzk,
                TargetSellPriceCzk = targetSellPriceCzk,
                BtcToSellForRepayment = btcToSellForRepayment,
                RemainingBtcProfit = remainingBtc,
                IsViable = remainingBtc > 0
            };
            
            // Generate individual sell orders if the strategy is viable
            if (strategy.IsViable)
            {
                decimal btcPerOrder = loan.MaxSellOrders > 1 
                    ? Math.Max(btcToSellForRepayment / loan.MaxSellOrders, loan.MinSellOrderSize)
                    : btcToSellForRepayment;
                
                int orderCount = loan.MaxSellOrders > 1 
                    ? (int)Math.Ceiling(btcToSellForRepayment / btcPerOrder)
                    : 1;
                
                for (int i = 0; i < orderCount; i++)
                {
                    decimal orderBtcAmount = i == orderCount - 1 
                        ? btcToSellForRepayment - (btcPerOrder * i)
                        : btcPerOrder;
                    
                    strategy.SellOrders.Add(new SellStrategyOrder
                    {
                        BtcAmount = orderBtcAmount,
                        PricePerBtc = targetSellPriceCzk,
                        TotalCzk = orderBtcAmount * targetSellPriceCzk
                    });
                }
            }
            
            return strategy;
        }
    }
}
