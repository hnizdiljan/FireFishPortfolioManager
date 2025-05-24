using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Tests
{
    public class SmartDistributionActualTest
    {
        /// <summary>
        /// Test ověří aktuální problém: při 100% BTC profit ratio se generují sell ordery
        /// v hodnotě vyšší než jen částka ke splacení, pokud se musí upravit ceny nahoru.
        /// 
        /// Tento test přesně simuluje logiku z LoanService včetně všech úprav cen.
        /// </summary>
        [Fact]
        public void SmartDistribution_CurrentImplementation_BtcProfitRatio100_ActualProblem()
        {
            // Arrange - reálný problematický scénář
            decimal repaymentCzk = 50000m;          // Částka ke splacení: 50,000 CZK
            decimal targetProfitPercent = 30m;       // 30% zisk
            decimal btcProfitRatioPercent = 100m;    // 100% = veškerý profit v BTC
            int orderCount = 4;
            
            decimal currentBtcPrice = 2500000m;      // Současná cena: 2,500,000 CZK/BTC
            decimal totalAvailableBtc = 0.05m;       // Máme 0.05 BTC k dispozici
            
            // Základní výpočty podle logiky z LoanService
            decimal targetTotalValueCzk = repaymentCzk * (1 + targetProfitPercent / 100m); // 65,000 CZK
            decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;                    // 15,000 CZK
            
            // Pri 100% BTC profit ratio
            decimal profitFromCzk = totalProfitCzk * (1 - btcProfitRatioPercent / 100m);  // 0 CZK
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;                // 50,000 CZK
            
            Console.WriteLine($"=== Expected Values ===");
            Console.WriteLine($"Repayment amount: {repaymentCzk:F0} CZK");
            Console.WriteLine($"Target profit: {totalProfitCzk:F0} CZK ({targetProfitPercent}%)");
            Console.WriteLine($"BTC profit ratio: {btcProfitRatioPercent}%");
            Console.WriteLine($"Expected sell orders total: {targetCzkFromSellOrders:F0} CZK");
            Console.WriteLine();
            
            // Odhad BTC pro sell ordery
            decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
            decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtc * 0.99m);
            
            // Výpočet cen podle LoanService logiky
            decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
            decimal priceSpreadPercent = 0.4m;
            decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
            decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
            
            Console.WriteLine($"=== Original Price Calculation ===");
            Console.WriteLine($"Target avg price: {targetAvgPrice:F0} CZK/BTC");
            Console.WriteLine($"Original min price: {minPrice:F0} CZK/BTC");
            Console.WriteLine($"Original max price: {maxPrice:F0} CZK/BTC");
            Console.WriteLine($"Current BTC price: {currentBtcPrice:F0} CZK/BTC");
            Console.WriteLine($"BTC for sell orders: {btcForSellOrders:F6} BTC");
            Console.WriteLine();
            
            // Úprava cen podle LoanService logiky
            decimal originalMinPrice = minPrice;
            minPrice = Math.Max(minPrice, currentBtcPrice * 1.05m); // Min +5% nad současnou cenu
            maxPrice = Math.Max(maxPrice, minPrice * 1.2m);
            
            // OPRAVA z LoanService - úprava BTC množství pokud se ceny zvýšily
            decimal actualAvgPrice = (minPrice + maxPrice) / 2m;
            if (actualAvgPrice > targetAvgPrice)
            {
                decimal adjustedBtcForSellOrders = targetCzkFromSellOrders / actualAvgPrice;
                adjustedBtcForSellOrders = Math.Min(adjustedBtcForSellOrders, totalAvailableBtc * 0.99m);
                
                if (adjustedBtcForSellOrders != btcForSellOrders)
                {
                    Console.WriteLine($"=== Price Adjustment Applied ===");
                    Console.WriteLine($"Original BTC for sell orders: {btcForSellOrders:F6} BTC");
                    Console.WriteLine($"Adjusted BTC for sell orders: {adjustedBtcForSellOrders:F6} BTC");
                    btcForSellOrders = adjustedBtcForSellOrders;
                }
            }
            
            Console.WriteLine($"=== Adjusted Price Calculation ===");
            Console.WriteLine($"Adjusted min price: {minPrice:F0} CZK/BTC");
            Console.WriteLine($"Adjusted max price: {maxPrice:F0} CZK/BTC");
            Console.WriteLine($"Actual avg price: {actualAvgPrice:F0} CZK/BTC");
            Console.WriteLine($"Final BTC for sell orders: {btcForSellOrders:F6} BTC");
            Console.WriteLine();
            
            // Act - generování orderů přesně podle LoanService logiky
            var orders = new List<SellOrder>();
            decimal btcPerOrder = btcForSellOrders / orderCount;
            
            for (int i = 0; i < orderCount; i++)
            {
                decimal priceMultiplier = orderCount == 1 ? 0.5m : (decimal)i / (orderCount - 1);
                decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
                
                // Zaokrouhlení na tisíce - TADY MŮŽE BÝT DALŠÍ PROBLÉM
                orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                orderPrice = Math.Max(orderPrice, currentBtcPrice * 1.05m);

                decimal actualBtcAmount = (i == orderCount - 1)
                    ? btcForSellOrders - orders.Sum(o => o.BtcAmount) // Poslední order bere zbytek
                    : btcPerOrder;

                orders.Add(new SellOrder
                {
                    BtcAmount = actualBtcAmount,
                    PricePerBtc = orderPrice,
                    TotalCzk = actualBtcAmount * orderPrice,
                    Status = SellOrderStatus.Planned
                });
                
                Console.WriteLine($"Order {i + 1}: {actualBtcAmount:F6} BTC @ {orderPrice:F0} CZK = {actualBtcAmount * orderPrice:F0} CZK");
            }
            
            // Assert - ověření výsledku
            decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
            decimal difference = actualTotalFromOrders - targetCzkFromSellOrders;
            decimal percentDifference = (difference / targetCzkFromSellOrders) * 100m;
            
            Console.WriteLine();
            Console.WriteLine($"=== FINAL RESULTS ===");
            Console.WriteLine($"Expected sell orders total: {targetCzkFromSellOrders:F0} CZK");
            Console.WriteLine($"Actual sell orders total: {actualTotalFromOrders:F0} CZK");
            Console.WriteLine($"Difference: {difference:F0} CZK ({percentDifference:F2}%)");
            
            // Tolerance 2% - při 100% BTC profit ratio by sell ordery měly pokrývat pouze repayment
            decimal tolerance = targetCzkFromSellOrders * 0.02m; // 2% tolerance
            
            if (Math.Abs(difference) > tolerance)
            {
                Console.WriteLine($"❌ PROBLÉM: Rozdíl {Math.Abs(difference):F0} CZK je větší než tolerance {tolerance:F0} CZK");
                Console.WriteLine($"❌ Při 100% BTC profit ratio by sell ordery měly pokrývat pouze částku ke splacení!");
            }
            else
            {
                Console.WriteLine($"✅ OK: Rozdíl je v rámci tolerance");
            }
            
            // Test fail pokud je rozdíl příliš velký
            Assert.True(Math.Abs(difference) <= tolerance,
                $"Při 100% BTC profit ratio by sell ordery měly pokrývat přibližně pouze částku ke splacení ({targetCzkFromSellOrders:F0} CZK), " +
                $"ale pokrývají {actualTotalFromOrders:F0} CZK. " +
                $"Rozdíl: {Math.Abs(difference):F0} CZK překračuje toleranci {tolerance:F0} CZK.");
        }
        
        /// <summary>
        /// Test pro ověření, že při 0% BTC profit ratio se sell ordery generují správně
        /// (měly by pokrývat repayment + celý profit).
        /// </summary>
        [Fact]
        public void SmartDistribution_CurrentImplementation_BtcProfitRatio0_ShouldCoverAll()
        {
            // Arrange
            decimal repaymentCzk = 50000m;          
            decimal targetProfitPercent = 30m;       
            decimal btcProfitRatioPercent = 0m;      // 0% = veškerý profit v CZK
            int orderCount = 3;
            
            decimal currentBtcPrice = 2500000m;      
            decimal totalAvailableBtc = 0.05m;       
            
            // Základní výpočty
            decimal targetTotalValueCzk = repaymentCzk * (1 + targetProfitPercent / 100m); // 65,000 CZK
            decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;                    // 15,000 CZK
            decimal profitFromCzk = totalProfitCzk * (1 - btcProfitRatioPercent / 100m);   // 15,000 CZK (veškerý profit)
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;                 // 65,000 CZK
            
            // Simulace generování podle LoanService logiky
            decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
            decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtc * 0.99m);
            
            decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
            decimal priceSpreadPercent = 0.4m;
            decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
            decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
            
            minPrice = Math.Max(minPrice, currentBtcPrice * 1.05m);
            maxPrice = Math.Max(maxPrice, minPrice * 1.2m);
            
            // Oprava - úprava BTC množství
            decimal actualAvgPrice = (minPrice + maxPrice) / 2m;
            if (actualAvgPrice > targetAvgPrice)
            {
                decimal adjustedBtcForSellOrders = targetCzkFromSellOrders / actualAvgPrice;
                adjustedBtcForSellOrders = Math.Min(adjustedBtcForSellOrders, totalAvailableBtc * 0.99m);
                btcForSellOrders = adjustedBtcForSellOrders;
            }
            
            // Generování orderů
            var orders = new List<SellOrder>();
            decimal btcPerOrder = btcForSellOrders / orderCount;
            
            for (int i = 0; i < orderCount; i++)
            {
                decimal priceMultiplier = orderCount == 1 ? 0.5m : (decimal)i / (orderCount - 1);
                decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
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
            
            // Assert
            decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
            decimal tolerance = targetCzkFromSellOrders * 0.05m; // 5% tolerance pro 0% BTC ratio
            
            Console.WriteLine($"=== BTC Profit Ratio 0% Test ===");
            Console.WriteLine($"Expected: {targetCzkFromSellOrders:F0} CZK (repayment + all profit)");
            Console.WriteLine($"Actual: {actualTotalFromOrders:F0} CZK");
            Console.WriteLine($"Difference: {Math.Abs(actualTotalFromOrders - targetCzkFromSellOrders):F0} CZK");
            Console.WriteLine($"Tolerance: {tolerance:F0} CZK");
            
            Assert.True(Math.Abs(actualTotalFromOrders - targetCzkFromSellOrders) <= tolerance,
                $"Při 0% BTC profit ratio by sell ordery měly pokrývat repayment + celý profit ({targetCzkFromSellOrders:F0} CZK), " +
                $"ale pokrývají {actualTotalFromOrders:F0} CZK. " +
                $"Rozdíl: {Math.Abs(actualTotalFromOrders - targetCzkFromSellOrders):F0} CZK překračuje toleranci {tolerance:F0} CZK.");
        }
    }
} 