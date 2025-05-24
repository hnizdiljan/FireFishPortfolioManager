using Microsoft.AspNetCore.Mvc;
using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly ILogger<DiagnosticsController> _logger;

        public DiagnosticsController(ILogger<DiagnosticsController> logger)
        {
            _logger = logger;
        }

        [HttpPost("test-smart-distribution")]
        public IActionResult TestSmartDistribution([FromBody] SmartDistributionTestRequest request)
        {
            _logger.LogInformation("=== DIAGNOSTIKA SMARTDISTRIBUTION ===");
            _logger.LogInformation("Input: RepaymentCzk={RepaymentCzk}, TargetProfitPercent={TargetProfitPercent}, BtcProfitRatioPercent={BtcProfitRatioPercent}, OrderCount={OrderCount}, TotalAvailableBtc={TotalAvailableBtc}, CurrentBtcPrice={CurrentBtcPrice}",
                request.RepaymentCzk, request.TargetProfitPercent, request.BtcProfitRatioPercent, request.OrderCount, request.TotalAvailableBtc, request.CurrentBtcPrice);

            try
            {
                // Simulace logiky z LoanService
                decimal targetTotalValueCzk = request.RepaymentCzk * (1 + request.TargetProfitPercent / 100m);
                decimal totalProfitCzk = targetTotalValueCzk - request.RepaymentCzk;
                decimal profitFromCzk = totalProfitCzk * (1 - request.BtcProfitRatioPercent / 100m);
                decimal targetCzkFromSellOrders = request.RepaymentCzk + profitFromCzk;

                _logger.LogInformation("Calculated: TargetTotalValueCzk={TargetTotalValueCzk}, TotalProfitCzk={TotalProfitCzk}, ProfitFromCzk={ProfitFromCzk}, TargetCzkFromSellOrders={TargetCzkFromSellOrders}",
                    targetTotalValueCzk, totalProfitCzk, profitFromCzk, targetCzkFromSellOrders);

                decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / request.CurrentBtcPrice;
                decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, request.TotalAvailableBtc * 0.99m);

                _logger.LogInformation("BTC Calculation: EstimatedBtcForSellOrders={EstimatedBtcForSellOrders}, BtcForSellOrders={BtcForSellOrders}",
                    estimatedBtcForSellOrders, btcForSellOrders);

                decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
                decimal priceSpreadPercent = 0.4m;
                decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
                decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);

                _logger.LogInformation("Price Calculation: TargetAvgPrice={TargetAvgPrice}, MinPrice={MinPrice}, MaxPrice={MaxPrice}",
                    targetAvgPrice, minPrice, maxPrice);

                // Úprava cen podle LoanService logiky
                decimal originalMinPrice = minPrice;
                minPrice = Math.Max(minPrice, request.CurrentBtcPrice * 1.05m);
                maxPrice = Math.Max(maxPrice, minPrice * 1.2m);

                _logger.LogInformation("Price Adjustment: OriginalMinPrice={OriginalMinPrice}, AdjustedMinPrice={AdjustedMinPrice}, AdjustedMaxPrice={AdjustedMaxPrice}",
                    originalMinPrice, minPrice, maxPrice);

                // OPRAVA z LoanService - úprava BTC množství pokud se ceny zvýšily
                decimal actualAvgPrice = (minPrice + maxPrice) / 2m;
                if (actualAvgPrice > targetAvgPrice)
                {
                    decimal adjustedBtcForSellOrders = targetCzkFromSellOrders / actualAvgPrice;
                    adjustedBtcForSellOrders = Math.Min(adjustedBtcForSellOrders, request.TotalAvailableBtc * 0.99m);
                    
                    if (adjustedBtcForSellOrders != btcForSellOrders)
                    {
                        _logger.LogInformation("*** PRICE ADJUSTMENT APPLIED: BTC changed from {OriginalBtc} to {AdjustedBtc}",
                            btcForSellOrders, adjustedBtcForSellOrders);
                        btcForSellOrders = adjustedBtcForSellOrders;
                    }
                    else
                    {
                        _logger.LogInformation("Price adjustment calculated but no change needed");
                    }
                }
                else
                {
                    _logger.LogInformation("No price adjustment needed: ActualAvgPrice={ActualAvgPrice} <= TargetAvgPrice={TargetAvgPrice}",
                        actualAvgPrice, targetAvgPrice);
                }

                _logger.LogInformation("Final: ActualAvgPrice={ActualAvgPrice}, FinalBtcForSellOrders={FinalBtcForSellOrders}",
                    actualAvgPrice, btcForSellOrders);

                // Generování orderů
                var orders = new List<TestSellOrder>();
                decimal btcPerOrder = btcForSellOrders / request.OrderCount;

                for (int i = 0; i < request.OrderCount; i++)
                {
                    decimal priceMultiplier = request.OrderCount == 1 ? 0.5m : (decimal)i / (request.OrderCount - 1);
                    decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
                    
                    decimal originalOrderPrice = orderPrice;
                    orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                    orderPrice = Math.Max(orderPrice, request.CurrentBtcPrice * 1.05m);

                    decimal actualBtcAmount = (i == request.OrderCount - 1)
                        ? btcForSellOrders - orders.Sum(o => o.BtcAmount)
                        : btcPerOrder;

                    var order = new TestSellOrder
                    {
                        OrderIndex = i + 1,
                        BtcAmount = actualBtcAmount,
                        PricePerBtc = orderPrice,
                        OriginalPrice = originalOrderPrice,
                        TotalCzk = actualBtcAmount * orderPrice
                    };

                    orders.Add(order);

                    _logger.LogInformation("Order {OrderIndex}: {BtcAmount} BTC @ {PricePerBtc} CZK (orig: {OriginalPrice}) = {TotalCzk} CZK",
                        order.OrderIndex, order.BtcAmount, order.PricePerBtc, order.OriginalPrice, order.TotalCzk);
                }

                decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
                decimal difference = actualTotalFromOrders - targetCzkFromSellOrders;
                decimal percentDifference = (difference / targetCzkFromSellOrders) * 100m;

                _logger.LogInformation("=== FINAL RESULT ===");
                _logger.LogInformation("Expected: {ExpectedCzk} CZK", targetCzkFromSellOrders);
                _logger.LogInformation("Actual: {ActualCzk} CZK", actualTotalFromOrders);
                _logger.LogInformation("Difference: {Difference} CZK ({PercentDifference}%)", difference, percentDifference);

                var result = new SmartDistributionTestResult
                {
                    Input = request,
                    ExpectedSellOrdersTotal = targetCzkFromSellOrders,
                    ActualSellOrdersTotal = actualTotalFromOrders,
                    Difference = difference,
                    PercentDifference = percentDifference,
                    Orders = orders,
                    TargetAvgPrice = targetAvgPrice,
                    ActualAvgPrice = actualAvgPrice,
                    PriceAdjustmentApplied = actualAvgPrice > targetAvgPrice,
                    BtcForSellOrders = btcForSellOrders,
                    RemainingBtc = request.TotalAvailableBtc - btcForSellOrders
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SmartDistribution test");
                return BadRequest($"Error: {ex.Message}");
            }
        }
    }

    public class SmartDistributionTestRequest
    {
        public decimal RepaymentCzk { get; set; }
        public decimal TargetProfitPercent { get; set; }
        public decimal BtcProfitRatioPercent { get; set; }
        public int OrderCount { get; set; }
        public decimal TotalAvailableBtc { get; set; }
        public decimal CurrentBtcPrice { get; set; }
    }

    public class SmartDistributionTestResult
    {
        public SmartDistributionTestRequest Input { get; set; } = new();
        public decimal ExpectedSellOrdersTotal { get; set; }
        public decimal ActualSellOrdersTotal { get; set; }
        public decimal Difference { get; set; }
        public decimal PercentDifference { get; set; }
        public List<TestSellOrder> Orders { get; set; } = new();
        public decimal TargetAvgPrice { get; set; }
        public decimal ActualAvgPrice { get; set; }
        public bool PriceAdjustmentApplied { get; set; }
        public decimal BtcForSellOrders { get; set; }
        public decimal RemainingBtc { get; set; }
    }

    public class TestSellOrder
    {
        public int OrderIndex { get; set; }
        public decimal BtcAmount { get; set; }
        public decimal PricePerBtc { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal TotalCzk { get; set; }
    }
} 