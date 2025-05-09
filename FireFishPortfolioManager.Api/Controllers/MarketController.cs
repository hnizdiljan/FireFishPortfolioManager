using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FireFishPortfolioManager.Api.Services;

namespace FireFishPortfolioManager.Api.Controllers
{
    [ApiController]
    [Route("api/market")]
    public class MarketController : ControllerBase
    {
        private readonly BitcoinMarketDataService _marketDataService;

        public MarketController(BitcoinMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        // GET: api/market/btc-ath
        [HttpGet("btc-ath")]
        public async Task<ActionResult<BtcAthModel>> GetBtcAthCzk()
        {
            var ath = await _marketDataService.GetCurrentBtcCzkPriceAsync();
            return Ok(new BtcAthModel { AthCzk = ath });
        }
    }

    public class BtcAthModel
    {
        public decimal AthCzk { get; set; }
    }
} 