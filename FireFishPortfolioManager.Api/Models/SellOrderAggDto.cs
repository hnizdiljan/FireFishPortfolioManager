using System;
using FireFishPortfolioManager.Data;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Api.Models
{
    public class SellOrderAggDto
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        [Required]
        public string CoinmateOrderId { get; set; }
        public decimal BtcAmount { get; set; }
        public decimal PricePerBtc { get; set; }
        public decimal TotalCzk { get; set; }
        public SellOrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        [Required]
        public LoanReferenceDto LoanReference { get; set; }
    }

    public class LoanReferenceDto
    {
        public int Id { get; set; }
        [Required]
        public string LoanId { get; set; }
        public decimal LoanAmountCzk { get; set; }
        public DateTime RepaymentDate { get; set; }
    }
} 