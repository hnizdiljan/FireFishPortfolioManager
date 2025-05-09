using System;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Data
{
    public class SellOrder
    {
        public int Id { get; set; }
        [Required]
        public int LoanId { get; set; }

        public Loan? Loan { get; set; }

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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }

    public enum SellOrderStatus
    {
        Planned,
        Submitted,
        PartiallyFilled,
        Completed,
        Cancelled,
        Failed
    }
} 