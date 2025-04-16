using System;

namespace FireFishPortfolioManager.Api.Models
{
    public class SellOrder
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public Loan Loan { get; set; }
        
        public string CoinmateOrderId { get; set; }
        public decimal BtcAmount { get; set; }
        public decimal PricePerBtc { get; set; }
        public decimal TotalCzk { get; set; }
        public SellOrderStatus Status { get; set; }
        
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
