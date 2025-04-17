using System;
using System.Collections.Generic;

namespace FireFishPortfolioManager.Api.Models
{
    public class Loan
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public User? User { get; set; }
        
        // User-entered data from Fire Fish interface
        public string LoanId { get; set; }  // Fire Fish Loan ID
        public DateTime LoanDate { get; set; } // Date when loan was taken

        // Add loan period in months
        public int LoanPeriodMonths { get; set; } // Period of the loan in months (e.g., 3, 6, 12, 18)

        public DateTime RepaymentDate { get; set; } // Date when loan needs to be repaid

        // Simplified two-state status
        public LoanStatus Status { get; set; }

        public decimal LoanAmountCzk { get; set; } // Amount borrowed in CZK
        public decimal InterestRate { get; set; } // Interest rate percentage

        // FireFish fee percentage with default 1.5%
        public decimal FireFishFeePercent { get; set; } = 1.5m;

        public decimal RepaymentAmountCzk { get; set; } // Amount to repay in CZK
        
        // Transaction-related data
        public decimal FeesBtc { get; set; } // Fees paid in BTC to Fire Fish
        public decimal TransactionFeesBtc { get; set; } // Transaction fees for sending BTC
        public decimal CollateralBtc { get; set; } // BTC collateral amount
        public decimal TotalSentBtc { get; set; } // Total BTC sent including fees
        
        // BTC purchase tracking
        public decimal PurchasedBtc { get; set; } // How much BTC was purchased with the loan
        public decimal CurrentBtcPrice { get; set; } // Current BTC price in CZK
        public decimal RepaymentWithFeesBtc { get; set; } // How much BTC is needed to repay loan with fees
        
        // Keep only total target profit percentage
        public decimal TotalTargetProfitPercentage { get; set; } // Total profit target percentage
        
        // New property: Bitcoin profit ratio for exit strategy
        public decimal BitcoinProfitRatio { get; set; } // Percent of profit to hold in BTC (0-100)
        
        // Tracking data
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Sell orders
        public List<SellOrder> SellOrders { get; set; } = new List<SellOrder>();
    }
    
    public enum LoanStatus
    {
        Active,
        Closed
    }

    public class LoanDto
    {
        public int Id { get; set; }
        public string LoanId { get; set; }
        public string LoanDate { get; set; }
        public int LoanPeriodMonths { get; set; }
        public string RepaymentDate { get; set; }
        public int Status { get; set; }
        public decimal LoanAmountCzk { get; set; }
        public decimal InterestRate { get; set; }
        public decimal FireFishFeePercent { get; set; }
        public decimal RepaymentAmountCzk { get; set; }
        public decimal FeesBtc { get; set; }
        public decimal TransactionFeesBtc { get; set; }
        public decimal CollateralBtc { get; set; }
        public decimal TotalSentBtc { get; set; }
        public decimal PurchasedBtc { get; set; }
        public decimal CurrentBtcPrice { get; set; }
        public decimal RepaymentWithFeesBtc { get; set; }
        public decimal TotalTargetProfitPercentage { get; set; }
        public decimal BitcoinProfitRatio { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}
