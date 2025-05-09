using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using FireFishPortfolioManager.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;

namespace FireFishPortfolioManager.Api.Services
{
    public class BitcoinMarketDataService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BitcoinMarketDataService> _logger;
        private readonly ApplicationDbContext _dbContext;
        private readonly IMemoryCache _memoryCache;
        private const string BTC_CZK_CACHE_KEY = "btc_czk_price";
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

        public BitcoinMarketDataService(HttpClient httpClient, ILogger<BitcoinMarketDataService> logger, ApplicationDbContext dbContext, IMemoryCache memoryCache)
        {
            _httpClient = httpClient;
            _logger = logger;
            _dbContext = dbContext;
            _memoryCache = memoryCache;
        }

        /// <summary>
        /// Gets the current BTC/CZK price from the database view with 1-hour caching
        /// </summary>
        public async Task<decimal> GetCurrentBtcCzkPriceAsync()
        {
            if (_memoryCache.TryGetValue(BTC_CZK_CACHE_KEY, out decimal cachedPrice))
            {
                return cachedPrice;
            }

            var priceEntity = await _dbContext.CurrentBtcCzkPrices.AsNoTracking().FirstOrDefaultAsync();
            if (priceEntity == null)
            {
                _logger.LogError("No BTC/CZK price found in v_CurrentBTCCZKPrice view.");
                throw new InvalidOperationException("BTC/CZK price not available.");
            }

            _memoryCache.Set(BTC_CZK_CACHE_KEY, priceEntity.Price, CacheDuration);
            return priceEntity.Price;
        }
    }
} 