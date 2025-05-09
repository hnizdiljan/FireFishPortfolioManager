using System;
using FireFishPortfolioManager.Data; // For LoanStatus enum
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Api.Models
{
    public class LoanDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string LoanId { get; set; }
        [Required]
        public string LoanDate { get; set; }
        // LoanPeriodMonths might be optional or default to 0 if not provided from entity, but usually present.
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
        [Required]
        public decimal PurchasedBtc { get; set; }
        [Required]
        public decimal PotentialValueCzk { get; set; }
        public decimal RemainingBtcAfterStrategy { get; set; }
        [Required]
        public string CreatedAt { get; set; }
        [Required]
        public string UpdatedAt { get; set; }
        public string StrategyJson { get; set; }
    }
} 