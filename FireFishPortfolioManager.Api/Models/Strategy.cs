using System.Collections.Generic;

namespace FireFishPortfolioManager.Api.Models
{
    public class SellStrategy
    {
        public int LoanId { get; set; }
        public decimal CurrentBtcPriceCzk { get; set; }
        public decimal TargetSellPriceCzk { get; set; }
        public decimal BtcToSellForRepayment { get; set; }
        public decimal RemainingBtcProfit { get; set; }
        public bool IsViable { get; set; }
        public List<SellStrategyOrder> SellOrders { get; set; } = new List<SellStrategyOrder>();
    }
    
    // Renamed from PlannedSellOrder
    public class SellStrategyOrder
    {
        public decimal BtcAmount { get; set; }
        public decimal PricePerBtc { get; set; }
        public decimal TotalCzk { get; set; }
    }
} 