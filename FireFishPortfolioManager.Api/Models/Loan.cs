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
        public DateTime RepaymentDate { get; set; } // Date when loan needs to be repaid
        public LoanStatus Status { get; set; } // Current status of the loan
        public decimal LoanAmountCzk { get; set; } // Amount borrowed in CZK
        public decimal InterestRate { get; set; } // Interest rate percentage
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
        
        // Profit strategy
        public decimal TargetProfitPercentage { get; set; } // Target profit percentage (e.g., 20%)
        public int MaxSellOrders { get; set; } // Maximum number of sell orders to create
        public decimal MinSellOrderSize { get; set; } // Minimum size of each sell order
        public decimal TotalTargetProfitPercentage { get; set; } // Total profit target percentage
        
        // Wallet address for remaining BTC after profit
        public string WithdrawalWalletAddress { get; set; }
        
        // Tracking data
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Sell orders
        public List<SellOrder> SellOrders { get; set; } = new List<SellOrder>();
    }
    
    public enum LoanStatus
    {
        PendingBtcTransfer,
        WaitingForFiat,
        PendingBtcPurchase,
        Active,
        PartiallyRepaid,
        Repaid,
        Overdue
    }

    public class LoanDto
    {
        public int Id { get; set; }
        public string LoanId { get; set; }
        public string LoanDate { get; set; }
        public string RepaymentDate { get; set; }
        public int Status { get; set; }
        public decimal LoanAmountCzk { get; set; }
        public decimal InterestRate { get; set; }
        public decimal RepaymentAmountCzk { get; set; }
        public decimal FeesBtc { get; set; }
        public decimal TransactionFeesBtc { get; set; }
        public decimal CollateralBtc { get; set; }
        public decimal TotalSentBtc { get; set; }
        public decimal PurchasedBtc { get; set; }
        public decimal CurrentBtcPrice { get; set; }
        public decimal RepaymentWithFeesBtc { get; set; }
        public decimal TargetProfitPercentage { get; set; }
        public int MaxSellOrders { get; set; }
        public decimal MinSellOrderSize { get; set; }
        public decimal TotalTargetProfitPercentage { get; set; }
        public string WithdrawalWalletAddress { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}
