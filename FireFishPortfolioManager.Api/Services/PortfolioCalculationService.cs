using FireFishPortfolioManager.Api.Models;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using FireFishPortfolioManager.Data;

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
        
    }
}
