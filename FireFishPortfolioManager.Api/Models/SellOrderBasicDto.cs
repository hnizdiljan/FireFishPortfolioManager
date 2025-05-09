using System;
using FireFishPortfolioManager.Data; // For SellOrderStatus
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Api.Models
{
    public class SellOrderBasicDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public int LoanId { get; set; }
        // No 'public Loan Loan { get; set; }'
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
        public DateTime? CompletedAt { get; set; }
    }
} 