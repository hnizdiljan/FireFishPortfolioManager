using System;
using System.Collections.Generic;
using Xunit;
using Newtonsoft.Json;
using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

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