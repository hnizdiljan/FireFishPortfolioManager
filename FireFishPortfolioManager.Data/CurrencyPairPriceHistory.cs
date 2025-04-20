using System;

namespace FireFishPortfolioManager.Data
{
    public class CurrencyPairPriceHistory
    {
        public int Id { get; set; }
        public DateTime Date { get; set; } // pouze datum
        public required string CurrencyPair { get; set; }
        public decimal Price { get; set; }
        public required string Source { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
