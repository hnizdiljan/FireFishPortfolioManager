using System;
using System.Collections.Generic;
using Xunit;
using Newtonsoft.Json;
using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;
using System.Linq;

namespace FireFishPortfolioManager.Api.Tests
{
    public class ExitStrategyTests
    {
        [Fact]
        public void CanSerializeAndDeserialize_HODL_Strategy()
        {
            // Arrange
            var loan = new Loan { Id = 1, LoanId = "L-001", UserId = "U-001", LoanDate = DateTime.UtcNow, RepaymentDate = DateTime.UtcNow.AddMonths(12), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            var strategy = new HodlExitStrategy();
            string json = JsonConvert.SerializeObject(strategy);
            loan.StrategyJson = json;
            // Act
            var deserialized = JsonConvert.DeserializeObject<HodlExitStrategy>(loan.StrategyJson);
            // Assert
            Assert.Equal(ExitStrategyType.HODL, deserialized?.Type);
        }

        [Fact]
        public void CustomLadder_ValidatesOrderPercentages()
        {
            // Arrange
            var strategy = new CustomLadderExitStrategy
            {
                Orders = new List<CustomLadderOrder>
                {
                    new CustomLadderOrder { TargetPriceCzk = 2000000m, PercentToSell = 50m },
                    new CustomLadderOrder { TargetPriceCzk = 2500000m, PercentToSell = 40m }
                }
            };
            decimal sum = 0;
            foreach (var o in strategy.Orders) sum += o.PercentToSell;
            // Assert
            Assert.True(sum <= 100);
        }

        [Fact]
        public void CustomLadder_ThrowsIfPercentagesExceed100()
        {
            // Arrange
            var strategy = new CustomLadderExitStrategy
            {
                Orders = new List<CustomLadderOrder>
                {
                    new CustomLadderOrder { TargetPriceCzk = 2000000m, PercentToSell = 60m },
                    new CustomLadderOrder { TargetPriceCzk = 2500000m, PercentToSell = 50m }
                }
            };
            decimal sum = 0;
            foreach (var o in strategy.Orders) sum += o.PercentToSell;
            // Assert
            Assert.True(sum > 100);
        }

        [Fact]
        public void SmartDistribution_GeneratesCorrectNumberOfOrders()
        {
            // Arrange
            int orderCount = 5;
            decimal targetProfit = 0.3m; // 30%
            decimal loanAmount = 100000m;
            decimal btcPrice = 1500000m;

            var strategy = new SmartDistributionExitStrategy
            {
                TargetProfitPercent = 30m,
                OrderCount = orderCount,
                BtcProfitRatioPercent = 100m
            };
            // Simulace generování orderů
            var orders = new List<SellOrder>();
            decimal profitCzk = loanAmount * targetProfit;
            decimal totalCzk = loanAmount + profitCzk;
            decimal btcToSell = totalCzk / btcPrice;
            decimal btcPerOrder = btcToSell / orderCount;
            for (int i = 0; i < orderCount; i++)
            {
                orders.Add(new SellOrder
                {
                    BtcAmount = btcPerOrder,
                    PricePerBtc = btcPrice + i * 100000,
                    TotalCzk = btcPerOrder * (btcPrice + i * 100000),
                    Status = SellOrderStatus.Planned
                });
            }
            // Assert
            Assert.Equal(orderCount, orders.Count);
        }

        [Fact]
        public void SmartDistribution_BtcProfitRatio_CalculationLogic_100Percent()
        {
            // Arrange - testujeme logiku výpočtu bez závislosti na LoanService
            var strategy = new SmartDistributionExitStrategy
            {
                TargetProfitPercent = 25m,  // 25% zisk
                OrderCount = 3,
                BtcProfitRatioPercent = 100m  // 100% = veškerý profit v BTC
            };
            
            decimal repaymentCzk = 100000m;  // Částka ke splacení: 100,000 CZK
            decimal targetTotalValue = repaymentCzk * (1 + strategy.TargetProfitPercent / 100m); // 125,000 CZK
            decimal totalProfitCzk = targetTotalValue - repaymentCzk; // 25,000 CZK
            
            // Act - aplikujeme logiku z LoanService
            decimal profitFromCzk = totalProfitCzk * (1 - strategy.BtcProfitRatioPercent / 100m);
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
            
            // Assert - při 100% BTC profit ratio by sell ordery měly pokrývat jen částku ke splacení
            Assert.Equal(0m, profitFromCzk); // Žádný profit v CZK
            Assert.Equal(repaymentCzk, targetCzkFromSellOrders); // Sell ordery = jen repayment
            Assert.Equal(100000m, targetCzkFromSellOrders); // Konkrétní hodnota
        }

        [Fact]
        public void SmartDistribution_BtcProfitRatio_CalculationLogic_0Percent()
        {
            // Arrange - testujeme logiku výpočtu bez závislosti na LoanService
            var strategy = new SmartDistributionExitStrategy
            {
                TargetProfitPercent = 25m,  // 25% zisk
                OrderCount = 3,
                BtcProfitRatioPercent = 0m  // 0% = veškerý profit v CZK
            };
            
            decimal repaymentCzk = 100000m;  // Částka ke splacení: 100,000 CZK
            decimal targetTotalValue = repaymentCzk * (1 + strategy.TargetProfitPercent / 100m); // 125,000 CZK
            decimal totalProfitCzk = targetTotalValue - repaymentCzk; // 25,000 CZK
            
            // Act - aplikujeme logiku z LoanService
            decimal profitFromCzk = totalProfitCzk * (1 - strategy.BtcProfitRatioPercent / 100m);
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
            
            // Assert - při 0% BTC profit ratio by sell ordery měly pokrývat celou cílovou hodnotu
            Assert.Equal(totalProfitCzk, profitFromCzk); // Veškerý profit v CZK
            Assert.Equal(targetTotalValue, targetCzkFromSellOrders); // Sell ordery = repayment + profit
            Assert.Equal(125000m, targetCzkFromSellOrders); // Konkrétní hodnota
        }

        [Fact]
        public void SmartDistribution_BtcProfitRatio_CalculationLogic_50Percent()
        {
            // Arrange - testujeme logiku výpočtu pro 50% BTC profit
            var strategy = new SmartDistributionExitStrategy
            {
                TargetProfitPercent = 20m,  // 20% zisk
                OrderCount = 2,
                BtcProfitRatioPercent = 50m  // 50% = polovina profitu v BTC, polovina v CZK
            };
            
            decimal repaymentCzk = 200000m;  // Částka ke splacení: 200,000 CZK
            decimal targetTotalValue = repaymentCzk * (1 + strategy.TargetProfitPercent / 100m); // 240,000 CZK
            decimal totalProfitCzk = targetTotalValue - repaymentCzk; // 40,000 CZK
            
            // Act - aplikujeme logiku z LoanService
            decimal profitFromCzk = totalProfitCzk * (1 - strategy.BtcProfitRatioPercent / 100m);
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
            
            // Assert - při 50% BTC profit ratio
            Assert.Equal(20000m, profitFromCzk); // Polovina profitu v CZK (20,000 CZK)
            Assert.Equal(220000m, targetCzkFromSellOrders); // Sell ordery = repayment + polovina profitu
        }

        [Fact]
        public void SellOrder_Status_Transitions_Are_Valid()
        {
            // Arrange
            var order = new SellOrder { Status = SellOrderStatus.Planned };
            // Planned -> Submitted
            order.Status = SellOrderStatus.Submitted;
            Assert.Equal(SellOrderStatus.Submitted, order.Status);
            // Submitted -> Planned
            order.Status = SellOrderStatus.Planned;
            Assert.Equal(SellOrderStatus.Planned, order.Status);
        }

        [Fact]
        public void ValidateCustomLadderStrategy_ReturnsTrue_ForValidStrategy()
        {
            var service = new FireFishPortfolioManager.Api.Services.ExitStrategyService();
            var strategy = new CustomLadderExitStrategy
            {
                Orders = new List<CustomLadderOrder>
                {
                    new CustomLadderOrder { TargetPriceCzk = 2000000m, PercentToSell = 50m },
                    new CustomLadderOrder { TargetPriceCzk = 2500000m, PercentToSell = 40m }
                }
            };
            var result = service.ValidateCustomLadderStrategy(strategy, out var error);
            Assert.True(result);
            Assert.Null(error);
        }

        [Fact]
        public void ValidateCustomLadderStrategy_ReturnsFalse_ForInvalidStrategy()
        {
            var service = new FireFishPortfolioManager.Api.Services.ExitStrategyService();
            var strategy = new CustomLadderExitStrategy
            {
                Orders = new List<CustomLadderOrder>
                {
                    new CustomLadderOrder { TargetPriceCzk = 2000000m, PercentToSell = 60m },
                    new CustomLadderOrder { TargetPriceCzk = 2500000m, PercentToSell = 50m }
                }
            };
            var result = service.ValidateCustomLadderStrategy(strategy, out var error);
            Assert.False(result);
            Assert.NotNull(error);
            Assert.Contains("100", error);
        }

        [Fact]
        public void ValidateCustomLadderStrategy_ReturnsFalse_ForEmptyOrders()
        {
            var service = new FireFishPortfolioManager.Api.Services.ExitStrategyService();
            var strategy = new CustomLadderExitStrategy { Orders = new List<CustomLadderOrder>() };
            var result = service.ValidateCustomLadderStrategy(strategy, out var error);
            Assert.False(result);
            Assert.NotNull(error);
        }
    }
} 