using System;
using FireFishPortfolioManager.Data;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Api.Models
{
    public class SellOrderAggDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public int LoanId { get; set; }
        // CoinmateOrderId can be null if order is only 'Planned'
        public string? CoinmateOrderId { get; set; }
        [Required]
        public decimal BtcAmount { get; set; }
        [Required]
        public decimal PricePerBtc { get; set; }
        [Required]
        public decimal TotalCzk { get; set; }
        [Required]
        public SellOrderStatus Status { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; } // Nullable is fine
        [Required]
        public LoanReferenceDto LoanReference { get; set; }
    }

    public class LoanReferenceDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string LoanId { get; set; } // This is the textual LoanId (e.g. L-001)
        [Required]
        public decimal LoanAmountCzk { get; set; }
        [Required]
        public DateTime RepaymentDate { get; set; }
    }
} 