using System.Text.Json;

namespace FireFishPortfolioManager.Api.Services
{
    public interface IMempoolService
    {
        Task<BitcoinTransactionDetails> GetTransactionDetailsAsync(string txId);
    }

    public class MempoolService : IMempoolService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MempoolService> _logger;

        public MempoolService(HttpClient httpClient, ILogger<MempoolService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<BitcoinTransactionDetails> GetTransactionDetailsAsync(string txId)
        {
            if (string.IsNullOrWhiteSpace(txId))
            {
                throw new ArgumentException("Transaction ID cannot be null or empty", nameof(txId));
            }

            try
            {
                var url = $"https://mempool.space/api/tx/{txId}";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        throw new KeyNotFoundException($"Transaction with ID {txId} not found");
                    }
                    throw new HttpRequestException($"Error fetching transaction data: {response.StatusCode}");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var mempoolTransaction = JsonSerializer.Deserialize<MempoolTransaction>(jsonContent, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                });

                if (mempoolTransaction == null)
                {
                    throw new InvalidOperationException("Failed to deserialize transaction data");
                }

                // Validate transaction structure
                if (mempoolTransaction.Vout == null || mempoolTransaction.Vout.Length != 2)
                {
                    throw new InvalidOperationException("Transaction must have exactly 2 outputs (collateral and FireFish fees)");
                }

                // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
                var collateralBtc = mempoolTransaction.Vout[0].Value / 100_000_000.0;
                var fireFishFeesBtc = mempoolTransaction.Vout[1].Value / 100_000_000.0;
                var transactionFeesBtc = mempoolTransaction.Fee / 100_000_000.0;

                return new BitcoinTransactionDetails
                {
                    TxId = mempoolTransaction.Txid,
                    CollateralBtc = collateralBtc,
                    FireFishFeesBtc = fireFishFeesBtc,
                    TransactionFeesBtc = transactionFeesBtc,
                    IsConfirmed = mempoolTransaction.Status?.Confirmed ?? false,
                    BlockHeight = mempoolTransaction.Status?.BlockHeight
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error when fetching transaction {TxId}", txId);
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON parsing error for transaction {TxId}", txId);
                throw new InvalidOperationException("Failed to parse transaction data", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error when fetching transaction {TxId}", txId);
                throw;
            }
        }
    }

    // DTOs for mempool.space API response
    public class MempoolTransaction
    {
        public string Txid { get; set; } = string.Empty;
        public long Fee { get; set; }
        public MempoolVout[]? Vout { get; set; }
        public MempoolStatus? Status { get; set; }
    }

    public class MempoolVout
    {
        public long Value { get; set; }
    }

    public class MempoolStatus
    {
        public bool Confirmed { get; set; }
        public int? BlockHeight { get; set; }
    }

    // Response DTO for our API
    public class BitcoinTransactionDetails
    {
        public string TxId { get; set; } = string.Empty;
        public double CollateralBtc { get; set; }
        public double FireFishFeesBtc { get; set; }
        public double TransactionFeesBtc { get; set; }
        public bool IsConfirmed { get; set; }
        public int? BlockHeight { get; set; }
    }
} 