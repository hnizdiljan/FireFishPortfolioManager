using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace FireFishPortfolioManager.Functions
{
    public class BitcoinPriceUpdater
    {
        private readonly ILogger _logger;
        private readonly ICurrencyPriceHistoryService _service;
        private readonly HttpClient _httpClient;

        public BitcoinPriceUpdater(ILoggerFactory loggerFactory, ICurrencyPriceHistoryService service, IHttpClientFactory httpClientFactory)
        {
            _logger = loggerFactory.CreateLogger<BitcoinPriceUpdater>();
            _service = service;
            _httpClient = httpClientFactory.CreateClient();
        }

        [Function("BitcoinPriceUpdater")]
        public async Task Run([
            TimerTrigger("%TimerSchedule%", RunOnStartup = true)
        ] TimerInfo myTimer)
        {
            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.UtcNow}");
            var today = DateTime.Now.Date;
            try
            {
                // Získání ceny BTC_CZK z Coinmate
                var btcCzk = await GetCoinmatePriceAsync("BTC_CZK");
                await _service.UpsertPriceAsync("BTC_CZK", btcCzk, "Coinmate", today);
                // Získání ceny BTC_EUR z Coinmate
                var btcEur = await GetCoinmatePriceAsync("BTC_EUR");
                await _service.UpsertPriceAsync("BTC_EUR", btcEur, "Coinmate", today);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating BTC prices");
            }
        }

        private async Task<decimal> GetCoinmatePriceAsync(string pair)
        {
            var url = $"https://coinmate.io/api/ticker?currencyPair={pair}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var price = doc.RootElement.GetProperty("data").GetProperty("last").GetDecimal();
            return price;
        }
    }
}
