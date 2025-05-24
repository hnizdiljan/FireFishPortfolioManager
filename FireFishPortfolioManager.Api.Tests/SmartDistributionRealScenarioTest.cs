using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Tests
{
    public class SmartDistributionRealScenarioTest
    {
        /// <summary>
        /// Test reálného scénáře: problém se objeví, když targetAvgPrice je nižší než currentBtcPrice * 1.05,
        /// protože se pak minPrice upraví nahoru a sell ordery vygenerují více peněz než má být.
        /// </summary>
        [Fact]
        public void SmartDistribution_BtcProfitRatio100_RealScenario_Problem()
        {
            // Arrange - reálný scénář kde se problém projeví
            decimal repaymentCzk = 100000m;        // Částka ke splacení: 100,000 CZK
            decimal targetProfitPercent = 25m;      // 25% zisk
            decimal btcProfitRatioPercent = 100m;   // 100% = veškerý profit v BTC
            int orderCount = 3;
            
            decimal currentBtcPrice = 2000000m;     // Současná cena: 2,000,000 CZK/BTC
            decimal totalAvailableBtc = 0.08m;      // Máme 0.08 BTC k dispozici
            
            // Výpočet podle logiky z LoanService
            decimal targetTotalValueCzk = repaymentCzk * (1 + targetProfitPercent / 100m); // 125,000 CZK
            decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;                    // 25,000 CZK
            
            // Pri 100% BTC profit ratio
            decimal profitFromCzk = totalProfitCzk * (1 - btcProfitRatioPercent / 100m);  // 0 CZK
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;                // 100,000 CZK
            
            // Odhad BTC pro sell ordery
            decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice; // 0.05 BTC
            decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtc * 0.99m);
            
            // Problémový výpočet cen podle LoanService logiky
            decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
            
            // Vytvoření cenového rozsahu
            decimal priceSpreadPercent = 0.4m;
            decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
            decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
            
            // TADY JE PROBLÉM - úprava minimální ceny
            decimal originalMinPrice = minPrice;
            minPrice = Math.Max(minPrice, currentBtcPrice * 1.05m); // Min +5% nad současnou cenu
            maxPrice = Math.Max(maxPrice, minPrice * 1.2m);
            
            // Act - simulace generování orderů
            var orders = new List<SellOrder>();
            decimal btcPerOrder = btcForSellOrders / orderCount;
            
            for (int i = 0; i < orderCount; i++)
            {
                decimal priceMultiplier = orderCount == 1 ? 0.5m : (decimal)i / (orderCount - 1);
                decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
                
                // Zaokrouhlení na tisíce
                orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                orderPrice = Math.Max(orderPrice, currentBtcPrice * 1.05m);

                decimal actualBtcAmount = (i == orderCount - 1)
                    ? btcForSellOrders - orders.Sum(o => o.BtcAmount)
                    : btcPerOrder;

                orders.Add(new SellOrder
                {
                    BtcAmount = actualBtcAmount,
                    PricePerBtc = orderPrice,
                    TotalCzk = actualBtcAmount * orderPrice,
                    Status = SellOrderStatus.Planned
                });
            }
            
            // Assert - ověření problému
            decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
            
            Console.WriteLine($"=== SmartDistribution Test Results ===");
            Console.WriteLine($"Target CZK from sell orders: {targetCzkFromSellOrders:F0} CZK");
            Console.WriteLine($"Actual CZK from sell orders: {actualTotalFromOrders:F0} CZK");
            Console.WriteLine($"Difference: {actualTotalFromOrders - targetCzkFromSellOrders:F0} CZK");
            Console.WriteLine($"");
            Console.WriteLine($"Original min price: {originalMinPrice:F0} CZK/BTC");
            Console.WriteLine($"Adjusted min price: {minPrice:F0} CZK/BTC");
            Console.WriteLine($"Max price: {maxPrice:F0} CZK/BTC");
            Console.WriteLine($"Current BTC price: {currentBtcPrice:F0} CZK/BTC");
            Console.WriteLine($"Target avg price: {targetAvgPrice:F0} CZK/BTC");
            
            // Tento test má selhat, protože sell ordery generují víc než targetCzkFromSellOrders
            // při 100% BTC profit ratio
            Assert.True(actualTotalFromOrders > targetCzkFromSellOrders, 
                $"Sell ordery generují {actualTotalFromOrders:F0} CZK místo očekávaných {targetCzkFromSellOrders:F0} CZK");
        }
        
        /// <summary>
        /// Test navrhovaného řešení: pokud se minPrice musí upravit nahoru,
        /// měli bychom upravit i btcForSellOrders dolů, aby se zachoval target.
        /// </summary>
        [Fact]
        public void SmartDistribution_BtcProfitRatio100_ProposedSolution()
        {
            // Arrange - stejný scénář jako výše
            decimal repaymentCzk = 100000m;
            decimal targetProfitPercent = 25m;
            decimal btcProfitRatioPercent = 100m;
            int orderCount = 3;
            
            decimal currentBtcPrice = 2000000m;
            decimal totalAvailableBtc = 0.08m;
            
            // Výpočet podle logiky z LoanService
            decimal targetTotalValueCzk = repaymentCzk * (1 + targetProfitPercent / 100m);
            decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;
            decimal profitFromCzk = totalProfitCzk * (1 - btcProfitRatioPercent / 100m);
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
            
            // Původní odhad BTC pro sell ordery
            decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
            decimal originalBtcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtc * 0.99m);
            
            // Původní výpočet cen
            decimal targetAvgPrice = targetCzkFromSellOrders / originalBtcForSellOrders;
            decimal priceSpreadPercent = 0.4m;
            decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
            decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
            
            // Pokud se minPrice musí upravit nahoru
            decimal adjustedMinPrice = Math.Max(minPrice, currentBtcPrice * 1.05m);
            decimal adjustedMaxPrice = Math.Max(maxPrice, adjustedMinPrice * 1.2m);
            
            // NAVRHOVANÉ ŘEŠENÍ: pokud se ceny upravily nahoru, upravíme i BTC množství dolů
            decimal adjustedAvgPrice = (adjustedMinPrice + adjustedMaxPrice) / 2m;
            decimal adjustedBtcForSellOrders = originalBtcForSellOrders;
            
            if (adjustedAvgPrice > targetAvgPrice)
            {
                // Pokud se průměrná cena zvýšila, snížíme množství BTC, aby zůstal stejný target
                adjustedBtcForSellOrders = targetCzkFromSellOrders / adjustedAvgPrice;
                adjustedBtcForSellOrders = Math.Min(adjustedBtcForSellOrders, totalAvailableBtc * 0.99m);
            }
            
            // Act - simulace generování orderů s upravenou logikou
            var orders = new List<SellOrder>();
            decimal btcPerOrder = adjustedBtcForSellOrders / orderCount;
            
            for (int i = 0; i < orderCount; i++)
            {
                decimal priceMultiplier = orderCount == 1 ? 0.5m : (decimal)i / (orderCount - 1);
                decimal orderPrice = adjustedMinPrice + (adjustedMaxPrice - adjustedMinPrice) * priceMultiplier;
                
                orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                orderPrice = Math.Max(orderPrice, currentBtcPrice * 1.05m);

                decimal actualBtcAmount = (i == orderCount - 1)
                    ? adjustedBtcForSellOrders - orders.Sum(o => o.BtcAmount)
                    : btcPerOrder;

                orders.Add(new SellOrder
                {
                    BtcAmount = actualBtcAmount,
                    PricePerBtc = orderPrice,
                    TotalCzk = actualBtcAmount * orderPrice,
                    Status = SellOrderStatus.Planned
                });
            }
            
            // Assert - ověření řešení
            decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
            decimal tolerance = targetCzkFromSellOrders * 0.02m; // 2% tolerance
            
            Console.WriteLine($"=== Proposed Solution Test Results ===");
            Console.WriteLine($"Target CZK from sell orders: {targetCzkFromSellOrders:F0} CZK");
            Console.WriteLine($"Actual CZK from sell orders: {actualTotalFromOrders:F0} CZK");
            Console.WriteLine($"Difference: {actualTotalFromOrders - targetCzkFromSellOrders:F0} CZK");
            Console.WriteLine($"Tolerance: {tolerance:F0} CZK");
            Console.WriteLine($"");
            Console.WriteLine($"Original BTC for sell orders: {originalBtcForSellOrders:F6} BTC");
            Console.WriteLine($"Adjusted BTC for sell orders: {adjustedBtcForSellOrders:F6} BTC");
            Console.WriteLine($"Original avg price: {targetAvgPrice:F0} CZK/BTC");
            Console.WriteLine($"Adjusted avg price: {adjustedAvgPrice:F0} CZK/BTC");
            
            // Tento test má projít, protože s upravenou logikou se držíme targetu
            Assert.True(Math.Abs(actualTotalFromOrders - targetCzkFromSellOrders) <= tolerance,
                $"Sell ordery by měly generovat přibližně {targetCzkFromSellOrders:F0} CZK, ale generují {actualTotalFromOrders:F0} CZK (rozdíl: {Math.Abs(actualTotalFromOrders - targetCzkFromSellOrders):F0} CZK, tolerance: {tolerance:F0} CZK)");
        }
    }
} 