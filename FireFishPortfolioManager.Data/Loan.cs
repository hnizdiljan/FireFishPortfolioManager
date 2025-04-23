using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Data
{
    public class Loan
    {
        public int Id { get; set; }
        [Required]
        public string UserId { get; set; }
        public User? User { get; set; }
        [Required]
        public string LoanId { get; set; }
        [Required]
        public DateTime LoanDate { get; set; }
        public int LoanPeriodMonths { get; set; }
        [Required]
        public DateTime RepaymentDate { get; set; }

        [Required]
        public LoanStatus Status { get; set; }

        [Required]
        public decimal LoanAmountCzk { get; set; }

        [Required]
        public decimal InterestRate { get; set; }

        [Required]
        public decimal RepaymentAmountCzk { get; set; }

        [Required]
        public decimal FeesBtc { get; set; }

        [Required]
        public decimal TransactionFeesBtc { get; set; }

        [Required]
        public decimal CollateralBtc { get; set; }
        [Required]
        public decimal TotalSentBtc { get; set; }

        [Required]
        public decimal PurchasedBtc { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        [Required]
        public List<SellOrder> SellOrders { get; set; } = new List<SellOrder>();
        public string? StrategyJson { get; set; }
    }

    public enum LoanStatus
    {
        Active,
        Closed
    }

    public class LoanDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string LoanId { get; set; }
        [Required]
        public string LoanDate { get; set; }
        [Required]
        public int LoanPeriodMonths { get; set; }
        [Required]
        public string RepaymentDate { get; set; }

        [Required]
        public LoanStatus Status { get; set; }

        [Required]
        public decimal LoanAmountCzk { get; set; }
        [Required]
        public decimal InterestRate { get; set; }
        [Required]
        public decimal RepaymentAmountCzk { get; set; }
        [Required]
        public decimal FeesBtc { get; set; }
        [Required]
        public decimal TransactionFeesBtc { get; set; }
        [Required]
        public decimal CollateralBtc { get; set; }
        [Required]
        public decimal TotalSentBtc { get; set; }
        public decimal PurchasedBtc { get; set; }

        [Required]
        public string CreatedAt { get; set; }
        [Required]
        public string UpdatedAt { get; set; }
    }
} 