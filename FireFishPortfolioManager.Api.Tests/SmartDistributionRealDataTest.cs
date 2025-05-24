using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Tests
{
    public class SmartDistributionRealDataTest
    {
        /// <summary>
        /// Test s přesnými reálnými daty od uživatele:
        /// - Částka ke splacení: 104,512.33 CZK
        /// - BTC po poplatcích: 0.05113282 BTC
        /// - Cílový zisk: 100%
        /// - BTC profit ratio: 100%
        /// - Počet orderů: 4
        /// 
        /// Očekávaný výsledek: sell ordery = 104,512.33 CZK
        /// Aktuální problém: sell ordery = 101,146.88 CZK
        /// </summary>
        [Fact]
        public void SmartDistribution_RealUserData_BtcProfitRatio100_Problem()
        {
            // Arrange - přesná reálná data
            decimal repaymentCzk = 104512.33m;      // Částka ke splacení
            decimal targetProfitPercent = 100m;      // Cílový zisk 100%
            decimal btcProfitRatioPercent = 100m;    // BTC na profit 100%
            int orderCount = 4;                      // Počet orderů
            
            decimal totalAvailableBtc = 0.05113282m; // BTC nakoupeno po poplatcích
            
            // Simulujeme různé BTC ceny, abychom viděli kde je problém
            decimal[] testPrices = { 2000000m, 2500000m, 3000000m, 3500000m };
            
            foreach (decimal currentBtcPrice in testPrices)
            {
                Console.WriteLine($"\n=== TEST S BTC CENOU: {currentBtcPrice:F0} CZK/BTC ===");
                
                // Základní výpočty podle logiky z LoanService
                decimal targetTotalValueCzk = repaymentCzk * (1 + targetProfitPercent / 100m); // 209,024.66 CZK
                decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;                    // 104,512.33 CZK
                
                // Pri 100% BTC profit ratio
                decimal profitFromCzk = totalProfitCzk * (1 - btcProfitRatioPercent / 100m);  // 0 CZK
                decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;                // 104,512.33 CZK
                
                Console.WriteLine($"Expected sell orders total: {targetCzkFromSellOrders:F2} CZK");
                
                // Odhad BTC pro sell ordery
                decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
                decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtc * 0.99m);
                
                // Výpočet cen podle LoanService logiky
                decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
                decimal priceSpreadPercent = 0.4m;
                decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
                decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
                
                Console.WriteLine($"Target avg price: {targetAvgPrice:F0} CZK/BTC");
                Console.WriteLine($"Original min price: {minPrice:F0} CZK/BTC");
                Console.WriteLine($"Original max price: {maxPrice:F0} CZK/BTC");
                Console.WriteLine($"BTC for sell orders: {btcForSellOrders:F8} BTC");
                
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
                        Console.WriteLine($"*** PRICE ADJUSTMENT: BTC změněno z {btcForSellOrders:F8} na {adjustedBtcForSellOrders:F8}");
                        btcForSellOrders = adjustedBtcForSellOrders;
                    }
                }
                
                Console.WriteLine($"Adjusted min price: {minPrice:F0} CZK/BTC");
                Console.WriteLine($"Adjusted max price: {maxPrice:F0} CZK/BTC");
                Console.WriteLine($"Actual avg price: {actualAvgPrice:F0} CZK/BTC");
                Console.WriteLine($"Final BTC for sell orders: {btcForSellOrders:F8} BTC");
                
                // Generování orderů přesně podle LoanService logiky
                var orders = new List<SellOrder>();
                decimal btcPerOrder = btcForSellOrders / orderCount;
                
                for (int i = 0; i < orderCount; i++)
                {
                    decimal priceMultiplier = orderCount == 1 ? 0.5m : (decimal)i / (orderCount - 1);
                    decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
                    
                    // TADY JE MOŽNÝ PROBLÉM - zaokrouhlení na tisíce
                    decimal originalOrderPrice = orderPrice;
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
                    
                    Console.WriteLine($"Order {i + 1}: {actualBtcAmount:F8} BTC @ {orderPrice:F0} CZK (orig: {originalOrderPrice:F0}) = {actualBtcAmount * orderPrice:F2} CZK");
                }
                
                // Výsledek
                decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
                decimal difference = actualTotalFromOrders - targetCzkFromSellOrders;
                decimal percentDifference = (difference / targetCzkFromSellOrders) * 100m;
                
                Console.WriteLine($"*** VÝSLEDEK ***");
                Console.WriteLine($"Expected: {targetCzkFromSellOrders:F2} CZK");
                Console.WriteLine($"Actual: {actualTotalFromOrders:F2} CZK");
                Console.WriteLine($"Difference: {difference:F2} CZK ({percentDifference:F2}%)");
                
                // Zbývající BTC a jeho hodnota
                decimal remainingBtc = totalAvailableBtc - btcForSellOrders;
                decimal highestSellPrice = orders.Max(o => o.PricePerBtc);
                decimal remainingBtcValue = remainingBtc * highestSellPrice;
                decimal totalPotentialValue = actualTotalFromOrders + remainingBtcValue;
                decimal actualProfitPercent = ((totalPotentialValue - repaymentCzk) / repaymentCzk) * 100m;
                
                Console.WriteLine($"Remaining BTC: {remainingBtc:F8} BTC");
                Console.WriteLine($"Highest sell price: {highestSellPrice:F0} CZK/BTC");
                Console.WriteLine($"Remaining BTC value: {remainingBtcValue:F2} CZK");
                Console.WriteLine($"Total potential value: {totalPotentialValue:F2} CZK");
                Console.WriteLine($"Actual profit: {actualProfitPercent:F2}% (target: {targetProfitPercent}%)");
                
                // Test je problém pokud sell ordery nepokrývají repayment při 100% BTC profit ratio
                if (Math.Abs(actualTotalFromOrders - targetCzkFromSellOrders) > targetCzkFromSellOrders * 0.01m) // 1% tolerance
                {
                    Console.WriteLine($"❌ PROBLÉM: Při BTC ceně {currentBtcPrice:F0} CZK/BTC");
                }
                else
                {
                    Console.WriteLine($"✅ OK: Při BTC ceně {currentBtcPrice:F0} CZK/BTC");
                }
            }
            
            // Assert - test selže pokud je problém s nejběžnější cenou
            decimal commonBtcPrice = 2500000m;
            var result = SimulateSmartDistribution(repaymentCzk, targetProfitPercent, btcProfitRatioPercent, 
                                                 orderCount, totalAvailableBtc, commonBtcPrice);
            
            decimal tolerance = repaymentCzk * 0.01m; // 1% tolerance
            Assert.True(Math.Abs(result.ActualSellOrdersTotal - result.ExpectedSellOrdersTotal) <= tolerance,
                $"PROBLÉM S REÁLNÝMI DATY: Expected {result.ExpectedSellOrdersTotal:F2} CZK, actual {result.ActualSellOrdersTotal:F2} CZK, " +
                $"difference {Math.Abs(result.ActualSellOrdersTotal - result.ExpectedSellOrdersTotal):F2} CZK");
        }
        
        /// <summary>
        /// Test s reálnou BTC cenou kolem 1.98 milionu CZK, která může způsobovat problém
        /// </summary>
        [Fact]
        public void SmartDistribution_RealBtcPrice_1980000_Problem()
        {
            // Arrange - přesná reálná data s problematickou BTC cenou
            decimal repaymentCzk = 104512.33m;      
            decimal targetProfitPercent = 100m;      
            decimal btcProfitRatioPercent = 100m;    
            int orderCount = 4;                      
            
            decimal totalAvailableBtc = 0.05113282m; 
            decimal currentBtcPrice = 1980000m;      // Reálná BTC cena, která může způsobovat problém
            
            Console.WriteLine($"\n=== TEST S REÁLNOU BTC CENOU: {currentBtcPrice:F0} CZK/BTC ===");
            
            var result = SimulateSmartDistribution(repaymentCzk, targetProfitPercent, btcProfitRatioPercent, 
                                                 orderCount, totalAvailableBtc, currentBtcPrice);
            
            Console.WriteLine($"Expected sell orders total: {result.ExpectedSellOrdersTotal:F2} CZK");
            Console.WriteLine($"Actual sell orders total: {result.ActualSellOrdersTotal:F2} CZK");
            Console.WriteLine($"Difference: {result.ActualSellOrdersTotal - result.ExpectedSellOrdersTotal:F2} CZK");
            
            // Detailní výpis orderů
            for (int i = 0; i < result.Orders.Count; i++)
            {
                var order = result.Orders[i];
                Console.WriteLine($"Order {i + 1}: {order.BtcAmount:F8} BTC @ {order.PricePerBtc:F0} CZK = {order.TotalCzk:F2} CZK");
            }
            
            // Zbývající BTC
            Console.WriteLine($"Remaining BTC: {result.RemainingBtc:F8} BTC");
            
            // Při 100% BTC profit ratio by sell ordery měly pokrývat přesně repayment
            decimal tolerance = repaymentCzk * 0.01m; // 1% tolerance
            decimal difference = Math.Abs(result.ActualSellOrdersTotal - result.ExpectedSellOrdersTotal);
            
            if (difference > tolerance)
            {
                Console.WriteLine($"❌ PROBLÉM POTVRZEN: Rozdíl {difference:F2} CZK překračuje toleranci {tolerance:F2} CZK");
                Console.WriteLine($"Sell ordery generují {result.ActualSellOrdersTotal:F2} CZK místo očekávaných {result.ExpectedSellOrdersTotal:F2} CZK");
            }
            else
            {
                Console.WriteLine($"✅ OK: Rozdíl {difference:F2} CZK je v rámci tolerance {tolerance:F2} CZK");
            }
            
            // Test by měl projít s opravou
            Assert.True(difference <= tolerance,
                $"PROBLÉM: Expected {result.ExpectedSellOrdersTotal:F2} CZK, actual {result.ActualSellOrdersTotal:F2} CZK, " +
                $"difference {difference:F2} CZK překračuje toleranci {tolerance:F2} CZK");
        }
        
        /// <summary>
        /// Test s přesnými hodnotami, které uživatel uvádí:
        /// - Sell ordery generují 101,146.88 CZK místo očekávaných 104,512.33 CZK
        /// - Rozdíl: 3,365.45 CZK (3.22%)
        /// </summary>
        [Fact]
        public void SmartDistribution_UserReportedProblem_101146_vs_104512()
        {
            // Arrange - přesné hodnoty z uživatelova reportu
            decimal repaymentCzk = 104512.33m;      
            decimal targetProfitPercent = 100m;      
            decimal btcProfitRatioPercent = 100m;    
            int orderCount = 4;                      
            
            decimal totalAvailableBtc = 0.05113282m; 
            decimal reportedSellOrdersTotal = 101146.88m; // Co uživatel vidí
            decimal expectedSellOrdersTotal = 104512.33m; // Co by mělo být
            decimal difference = reportedSellOrdersTotal - expectedSellOrdersTotal; // -3,365.45 CZK
            
            Console.WriteLine($"\n=== ANALÝZA PROBLÉMU UŽIVATELE ===");
            Console.WriteLine($"Reported sell orders total: {reportedSellOrdersTotal:F2} CZK");
            Console.WriteLine($"Expected sell orders total: {expectedSellOrdersTotal:F2} CZK");
            Console.WriteLine($"Difference: {difference:F2} CZK ({(difference / expectedSellOrdersTotal * 100):F2}%)");
            
            // Zpětný výpočet - jaká BTC cena by vedla k tomuto problému?
            // Pokud sell ordery generují 101,146.88 CZK místo 104,512.33 CZK,
            // znamená to, že se použilo méně BTC nebo nižší ceny
            
            // Zkusíme různé BTC ceny a najdeme tu, která vede k problému
            decimal[] testPrices = { 1800000m, 1900000m, 1950000m, 1980000m, 2000000m, 2100000m, 2200000m };
            
            foreach (decimal currentBtcPrice in testPrices)
            {
                var result = SimulateSmartDistribution(repaymentCzk, targetProfitPercent, btcProfitRatioPercent, 
                                                     orderCount, totalAvailableBtc, currentBtcPrice);
                
                decimal actualDifference = result.ActualSellOrdersTotal - expectedSellOrdersTotal;
                decimal percentDifference = (actualDifference / expectedSellOrdersTotal) * 100m;
                
                Console.WriteLine($"BTC Price: {currentBtcPrice:F0} CZK => Sell orders: {result.ActualSellOrdersTotal:F2} CZK, Diff: {actualDifference:F2} CZK ({percentDifference:F2}%)");
                
                // Pokud je rozdíl blízko reportovanému problému
                if (Math.Abs(result.ActualSellOrdersTotal - reportedSellOrdersTotal) < 1000m)
                {
                    Console.WriteLine($"*** MOŽNÁ PŘÍČINA: BTC cena {currentBtcPrice:F0} CZK vede k podobnému problému ***");
                    
                    // Detailní analýza
                    Console.WriteLine($"Detail orderů při BTC ceně {currentBtcPrice:F0} CZK:");
                    for (int i = 0; i < result.Orders.Count; i++)
                    {
                        var order = result.Orders[i];
                        Console.WriteLine($"  Order {i + 1}: {order.BtcAmount:F8} BTC @ {order.PricePerBtc:F0} CZK = {order.TotalCzk:F2} CZK");
                    }
                    Console.WriteLine($"  Total: {result.ActualSellOrdersTotal:F2} CZK");
                    Console.WriteLine($"  Remaining BTC: {result.RemainingBtc:F8} BTC");
                }
            }
            
            // Test s nejpravděpodobnější cenou, která by mohla způsobit problém
            decimal problematicPrice = 1950000m; // Cena, která by mohla vést k problému
            var problematicResult = SimulateSmartDistribution(repaymentCzk, targetProfitPercent, btcProfitRatioPercent, 
                                                            orderCount, totalAvailableBtc, problematicPrice);
            
            Console.WriteLine($"\n=== SIMULACE S PROBLEMATICKOU CENOU {problematicPrice:F0} CZK ===");
            Console.WriteLine($"Expected: {expectedSellOrdersTotal:F2} CZK");
            Console.WriteLine($"Actual: {problematicResult.ActualSellOrdersTotal:F2} CZK");
            Console.WriteLine($"Difference: {problematicResult.ActualSellOrdersTotal - expectedSellOrdersTotal:F2} CZK");
            
            // Pokud oprava funguje, rozdíl by měl být minimální
            decimal tolerance = expectedSellOrdersTotal * 0.02m; // 2% tolerance
            decimal actualDiff = Math.Abs(problematicResult.ActualSellOrdersTotal - expectedSellOrdersTotal);
            
            if (actualDiff <= tolerance)
            {
                Console.WriteLine($"✅ OPRAVA FUNGUJE: Rozdíl {actualDiff:F2} CZK je v rámci tolerance {tolerance:F2} CZK");
            }
            else
            {
                Console.WriteLine($"❌ PROBLÉM PŘETRVÁVÁ: Rozdíl {actualDiff:F2} CZK překračuje toleranci {tolerance:F2} CZK");
                
                // Možné příčiny:
                Console.WriteLine("\nMožné příčiny problému:");
                Console.WriteLine("1. Oprava nebyla nasazena do produkce");
                Console.WriteLine("2. Používá se jiná verze kódu (např. ExitStrategyService místo LoanService)");
                Console.WriteLine("3. Jiná BTC cena než očekávaná");
                Console.WriteLine("4. Problém v zaokrouhlování cen na tisíce");
                Console.WriteLine("5. Problém s výpočtem minimální ceny (+5% nad současnou)");
            }
            
            // Test by měl projít s opravou
            Assert.True(actualDiff <= tolerance,
                $"PROBLÉM: Expected {expectedSellOrdersTotal:F2} CZK, actual {problematicResult.ActualSellOrdersTotal:F2} CZK, " +
                $"difference {actualDiff:F2} CZK překračuje toleranci {tolerance:F2} CZK");
        }
        
        private SmartDistributionResult SimulateSmartDistribution(decimal repaymentCzk, decimal targetProfitPercent, 
            decimal btcProfitRatioPercent, int orderCount, decimal totalAvailableBtc, decimal currentBtcPrice)
        {
            decimal targetTotalValueCzk = repaymentCzk * (1 + targetProfitPercent / 100m);
            decimal totalProfitCzk = targetTotalValueCzk - repaymentCzk;
            decimal profitFromCzk = totalProfitCzk * (1 - btcProfitRatioPercent / 100m);
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
            
            decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
            decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, totalAvailableBtc * 0.99m);
            
            decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
            decimal priceSpreadPercent = 0.4m;
            decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
            decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
            
            minPrice = Math.Max(minPrice, currentBtcPrice * 1.05m);
            maxPrice = Math.Max(maxPrice, minPrice * 1.2m);
            
            decimal actualAvgPrice = (minPrice + maxPrice) / 2m;
            if (actualAvgPrice > targetAvgPrice)
            {
                decimal adjustedBtcForSellOrders = targetCzkFromSellOrders / actualAvgPrice;
                adjustedBtcForSellOrders = Math.Min(adjustedBtcForSellOrders, totalAvailableBtc * 0.99m);
                btcForSellOrders = adjustedBtcForSellOrders;
            }
            
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
            
            decimal actualTotalFromOrders = orders.Sum(o => o.TotalCzk);
            
            return new SmartDistributionResult
            {
                ExpectedSellOrdersTotal = targetCzkFromSellOrders,
                ActualSellOrdersTotal = actualTotalFromOrders,
                Orders = orders,
                RemainingBtc = totalAvailableBtc - btcForSellOrders
            };
        }
        
        public class SmartDistributionResult
        {
            public decimal ExpectedSellOrdersTotal { get; set; }
            public decimal ActualSellOrdersTotal { get; set; }
            public List<SellOrder> Orders { get; set; } = new List<SellOrder>();
            public decimal RemainingBtc { get; set; }
        }
    }
} 