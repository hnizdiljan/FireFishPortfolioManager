using FireFishPortfolioManager.Api.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FireFishPortfolioManager.Data;

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

        public async Task<bool> CancelSellOrderAsync(string clientId, string apiKey, string apiSecret, string coinmateOrderId)
        {
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret) || string.IsNullOrEmpty(coinmateOrderId))
                return false;
            try
            {
                var nonce = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                var parameters = new Dictionary<string, string>
                {
                    { "clientId", clientId },
                    { "orderId", coinmateOrderId },
                    { "nonce", nonce },
                };
                var message = string.Join("", parameters.Values);
                var signature = CreateHmacSignature(message, apiSecret);
                var content = new FormUrlEncodedContent(new Dictionary<string, string>(parameters)
                {
                    { "signature", signature }
                });
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Post,
                    RequestUri = new Uri($"{ApiBaseUrl}cancelOrder"),
                    Content = content,
                    Headers = { { "API-Key", apiKey } }
                };
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var responseContent = await response.Content.ReadAsStringAsync();
                // Assume success if no error thrown
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling sell order {OrderId} on Coinmate", coinmateOrderId);
                return false;
            }
        }

        public async Task<SellOrderStatus?> GetSellOrderStatusAsync(string clientId, string apiKey, string apiSecret, string coinmateOrderId)
        {
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret) || string.IsNullOrEmpty(coinmateOrderId))
                return null;
            try
            {
                var nonce = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                var parameters = new Dictionary<string, string>
                {
                    { "clientId", clientId },
                    { "orderId", coinmateOrderId },
                    { "nonce", nonce },
                };
                var message = string.Join("", parameters.Values);
                var signature = CreateHmacSignature(message, apiSecret);
                var content = new FormUrlEncodedContent(new Dictionary<string, string>(parameters)
                {
                    { "signature", signature }
                });
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Post,
                    RequestUri = new Uri($"{ApiBaseUrl}orderStatus"),
                    Content = content,
                    Headers = { { "API-Key", apiKey } }
                };
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var responseContent = await response.Content.ReadAsStringAsync();
                // Parse response and map to SellOrderStatus
                var json = JsonDocument.Parse(responseContent);
                var root = json.RootElement;
                if (root.TryGetProperty("data", out var data))
                {
                    var statusStr = data.GetProperty("status").GetString();
                    // Map Coinmate status to SellOrderStatus
                    switch (statusStr)
                    {
                        case "OPEN": return SellOrderStatus.Submitted;
                        case "PARTIALLY_FILLED": return SellOrderStatus.PartiallyFilled;
                        case "FILLED": return SellOrderStatus.Completed;
                        case "CANCELLED": return SellOrderStatus.Cancelled;
                        case "FAILED": return SellOrderStatus.Failed;
                        default: return null;
                    }
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting status for sell order {OrderId} on Coinmate", coinmateOrderId);
                return null;
            }
        }
    }

    // Response model classes for Coinmate API
    public class CoinmateTickerResponse
    {
        public bool Success { get; set; }
        public CoinmateTickerData? Data { get; set; }
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
        public CoinmateSellOrderData? Data { get; set; }
    }

    public class CoinmateSellOrderData
    {
        public required string Id { get; set; }
    }
}
