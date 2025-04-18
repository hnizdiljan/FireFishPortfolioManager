using FireFishPortfolioManager.Api.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FireFishPortfolioManager.Api.Services
{
    public class CoinmateService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CoinmateService> _logger;
        private const string ApiBaseUrl = "https://api.coinmate.io/api/v1/";

        public CoinmateService(HttpClient httpClient, ILogger<CoinmateService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        /// <summary>
        /// Gets the current BTC price in CZK from Coinmate
        /// </summary>
        /// <returns>Current BTC price in CZK</returns>
        public async Task<decimal> GetCurrentBtcPriceCzkAsync()
        {
            try
            {
                var url = $"https://coinmate.io/api/ticker?currencyPair=BTC_CZK";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                var json = JsonDocument.Parse(content);
                var root = json.RootElement;
                if (root.TryGetProperty("data", out var data) && data.TryGetProperty("last", out var last))
                {
                    return last.GetDecimal();
                }
                throw new Exception("Invalid response from Coinmate API: 'last' price not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching BTC price from Coinmate");
                throw;
            }
        }

        /// <summary>
        /// Places a sell order on Coinmate (uses provided credentials)
        /// </summary>
        /// <param name="clientId">Coinmate client ID (needs to be extracted or provided)</param>
        /// <param name="apiKey">Coinmate API key</param>
        /// <param name="apiSecret">Coinmate API secret</param>
        /// <param name="btcAmount">BTC amount to sell</param>
        /// <param name="priceCzk">Price per BTC in CZK</param>
        /// <returns>Order ID if successful</returns>
        public async Task<string> PlaceSellOrderAsync(string clientId, string apiKey, string apiSecret, decimal btcAmount, decimal priceCzk)
        {
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
                throw new InvalidOperationException("Coinmate API credentials are required.");

            try
            {
                var nonce = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                
                var parameters = new Dictionary<string, string>
                {
                    { "clientId", clientId }, // Use provided clientId
                    { "amount", btcAmount.ToString(System.Globalization.CultureInfo.InvariantCulture) },
                    { "price", priceCzk.ToString(System.Globalization.CultureInfo.InvariantCulture) },
                    { "currencyPair", "BTC_CZK" },
                    { "nonce", nonce },
                };
                
                // Create signature using provided secret
                var message = string.Join("", parameters.Values);
                var signature = CreateHmacSignature(message, apiSecret);
                
                var content = new FormUrlEncodedContent(new Dictionary<string, string>(parameters)
                {
                    { "signature", signature }
                });
                
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Post,
                    RequestUri = new Uri($"{ApiBaseUrl}sellLimit"),
                    Content = content,
                    Headers = { { "API-Key", apiKey } } // Use provided API key
                };
                
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var responseContent = await response.Content.ReadAsStringAsync();
                var orderResponse = JsonSerializer.Deserialize<CoinmateSellOrderResponse>(responseContent);
                
                if (orderResponse?.Data == null || string.IsNullOrEmpty(orderResponse.Data.Id))
                {
                    throw new Exception("Invalid response from Coinmate API when placing sell order");
                }
                
                return orderResponse.Data.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error placing sell order on Coinmate");
                throw;
            }
        }

        /// <summary>
        /// Places multiple sell orders on Coinmate according to a sell strategy using user's credentials
        /// </summary>
        /// <param name="apiKey">User's Coinmate API key</param>
        /// <param name="apiSecret">User's Coinmate API secret</param>
        /// <param name="loan">Loan information</param>
        /// <param name="strategy">Sell strategy with planned orders</param>
        /// <returns>List of created sell orders</returns>
        public async Task<List<SellOrder>> ExecuteSellStrategyAsync(string apiKey, string apiSecret, Loan loan, Models.SellStrategy strategy)
        {
             if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
                throw new ArgumentException("User is missing Coinmate API credentials");
                
            if (loan == null)
                throw new ArgumentNullException(nameof(loan));
                
            if (strategy == null || !strategy.IsViable)
                throw new ArgumentException("Invalid or non-viable sell strategy");

            // TODO: How to get Client ID? Assume it can be derived or needs to be stored/provided.
            // For now, using a placeholder extraction method.
            var clientId = ExtractClientIdFromApiKey(apiKey); 

            var createdOrders = new List<SellOrder>();
            
            foreach (var plannedOrder in strategy.SellOrders)
            {
                try
                {
                    var coinmateOrderId = await PlaceSellOrderAsync(
                        clientId, 
                        apiKey, 
                        apiSecret,
                        plannedOrder.BtcAmount,
                        plannedOrder.PricePerBtc);
                        
                    var sellOrder = new SellOrder
                    {
                        LoanId = loan.Id,
                        CoinmateOrderId = coinmateOrderId,
                        BtcAmount = plannedOrder.BtcAmount,
                        PricePerBtc = plannedOrder.PricePerBtc,
                        Status = SellOrderStatus.Submitted,
                        CreatedAt = DateTime.UtcNow
                    };
                    createdOrders.Add(sellOrder);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error placing sell order {OrderIndex} for loan {LoanId}", 
                        strategy.SellOrders.IndexOf(plannedOrder), loan.Id);
                    // Continue with other orders even if one fails
                }
            }
            
            return createdOrders;
        }
        
        /// <summary>
        /// Creates HMAC-SHA256 signature for Coinmate API
        /// </summary>
        private string CreateHmacSignature(string message, string secret)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            
            using (var hmac = new HMACSHA256(keyBytes))
            {
                var hashBytes = hmac.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }

        // Helper to extract Client ID - Replace with actual logic if needed
        private string ExtractClientIdFromApiKey(string apiKey)
        {
            // Placeholder: Assumes Client ID might be part of the key or needs separate handling
            if (string.IsNullOrEmpty(apiKey)) return string.Empty;
            var parts = apiKey.Split('-');
            return parts.Length > 0 ? parts[0] : "UNKNOWN_CLIENT_ID"; // Adjust logic as needed
        } 
    }

    // Response model classes for Coinmate API
    public class CoinmateTickerResponse
    {
        public bool Success { get; set; }
        public CoinmateTickerData Data { get; set; }
    }

    public class CoinmateTickerData
    {
        public decimal? Last { get; set; }
        public decimal? High { get; set; }
        public decimal? Low { get; set; }
        public decimal? Volume { get; set; }
        public decimal? Bid { get; set; }
        public decimal? Ask { get; set; }
    }

    public class CoinmateSellOrderResponse
    {
        public bool Success { get; set; }
        public CoinmateSellOrderData Data { get; set; }
    }

    public class CoinmateSellOrderData
    {
        public string Id { get; set; }
    }
}
