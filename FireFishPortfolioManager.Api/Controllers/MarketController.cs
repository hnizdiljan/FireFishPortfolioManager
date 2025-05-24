using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FireFishPortfolioManager.Api.Services;
using Microsoft.EntityFrameworkCore;
using FireFishPortfolioManager.Data;
using System;
using System.Linq;
using System.Collections.Generic;

namespace FireFishPortfolioManager.Api.Controllers
{
    [ApiController]
    [Route("api/market")]
    public class MarketController : ControllerBase
    {
        private readonly BitcoinMarketDataService _marketDataService;
        private readonly PortfolioDbContext _portfolioDbContext;

        public MarketController(BitcoinMarketDataService marketDataService, PortfolioDbContext portfolioDbContext)
        {
            _marketDataService = marketDataService;
            _portfolioDbContext = portfolioDbContext;
        }

        // GET: api/market/btc-ath
        [HttpGet("btc-ath")]
        public async Task<ActionResult<BtcAthModel>> GetBtcAthCzk()
        {
            var ath = await _marketDataService.GetCurrentBtcCzkPriceAsync();
            return Ok(new BtcAthModel { AthCzk = ath });
        }

        // GET: api/market/btc-price-history?fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("btc-price-history")]
        public async Task<ActionResult<List<BtcPriceHistoryDto>>> GetBtcPriceHistory(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                // Default to last 2 years if no dates provided
                var endDate = toDate ?? DateTime.UtcNow.Date;
                var startDate = fromDate ?? endDate.AddYears(-2);

                var priceHistory = await _portfolioDbContext.CurrencyPairPriceHistories
                    .Where(p => p.CurrencyPair == "BTC_CZK" && 
                               p.Date >= startDate && 
                               p.Date <= endDate)
                    .OrderBy(p => p.Date)
                    .Select(p => new BtcPriceHistoryDto
                    {
                        Date = p.Date,
                        Price = p.Price,
                        Source = p.Source
                    })
                    .ToListAsync();

                return Ok(priceHistory);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching price history: {ex.Message}");
            }
        }
    }

    public class BtcAthModel
    {
        public decimal AthCzk { get; set; }
    }

    public class BtcPriceHistoryDto
    {
        public DateTime Date { get; set; }
        public decimal Price { get; set; }
        public required string Source { get; set; }
    }
} 