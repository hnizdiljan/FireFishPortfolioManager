using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace FireFishPortfolioManager.Api.Services
{
    public class BitcoinMarketDataService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BitcoinMarketDataService> _logger;
        private const string COINGECKO_ATH_URL = "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false";

        public BitcoinMarketDataService(HttpClient httpClient, ILogger<BitcoinMarketDataService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        /// <summary>
        /// Gets the all-time-high (ATH) price of BTC in CZK from CoinGecko
        /// </summary>
        public async Task<decimal> GetBtcAthCzkAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync(COINGECKO_ATH_URL);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var athCzk = doc.RootElement
                    .GetProperty("market_data")
                    .GetProperty("ath")
                    .GetProperty("czk")
                    .GetDecimal();
                return athCzk;
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error fetching BTC ATH from CoinGecko");
                throw;
            }
        }
    }
} 