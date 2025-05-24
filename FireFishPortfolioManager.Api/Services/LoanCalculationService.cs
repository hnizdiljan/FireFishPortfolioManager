using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;
using Newtonsoft.Json;
using Microsoft.Extensions.Logging;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Služba pro kalkulace související s půjčkami.
    /// Implementuje Single Responsibility Principle - zaměřuje se pouze na kalkulace.
    /// </summary>
    public class LoanCalculationService : ILoanCalculationService
    {
        private readonly ILogger<LoanCalculationService> _logger;

        public LoanCalculationService(ILogger<LoanCalculationService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public decimal CalculatePotentialValueCzk(Loan loan)
        {
            _logger.LogInformation("[Loan {LoanId}] CalculatePotentialValueCzk called", loan.Id);
            
            if (string.IsNullOrEmpty(loan.StrategyJson))
            {
                _logger.LogInformation("[Loan {LoanId}] No StrategyJson, using sell orders calculation", loan.Id);
                return CalculatePotentialValueFromSellOrders(loan);
            }

            try
            {
                var strategyBase = DeserializeStrategy(loan.StrategyJson);
                if (strategyBase == null)
                {
                    _logger.LogWarning("[Loan {LoanId}] Failed to deserialize strategy, using sell orders calculation", loan.Id);
                    return CalculatePotentialValueFromSellOrders(loan);
                }

                _logger.LogInformation("[Loan {LoanId}] Strategy type: {StrategyType}", loan.Id, strategyBase.GetType().Name);

                return strategyBase switch
                {
                    SmartDistributionExitStrategy smartDist => CalculateSmartDistributionPotentialValue(loan, smartDist),
                    CustomLadderExitStrategy customLadder => CalculateCustomLadderPotentialValue(loan, customLadder),
                    EquidistantLadderExitStrategy equidistant => CalculateEquidistantLadderPotentialValue(loan, equidistant),
                    EquifrequentLadderExitStrategy equifrequent => CalculateEquifrequentLadderPotentialValue(loan, equifrequent),
                    HodlExitStrategy => loan.RepaymentAmountCzk,
                    _ => CalculatePotentialValueFromSellOrders(loan)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating potential value for loan {LoanId}", loan.Id);
                return CalculatePotentialValueFromSellOrders(loan);
            }
        }

        public decimal CalculateAvailableBtcForStrategy(Loan loan)
        {
            var totalAvailableBtc = loan.PurchasedBtc - loan.FeesBtc - loan.TransactionFeesBtc;
            return Math.Max(0m, totalAvailableBtc);
        }

        public decimal CalculateRemainingBtcAfterStrategy(Loan loan)
        {
            var totalAvailableBtc = CalculateAvailableBtcForStrategy(loan);
            var btcSoldInPlannedOrders = CalculateBtcInPlannedOrders(loan);
            return Math.Max(0m, totalAvailableBtc - btcSoldInPlannedOrders);
        }

        private decimal CalculateSmartDistributionPotentialValue(Loan loan, SmartDistributionExitStrategy smartDist)
        {
            // Pro SmartDistribution VŽDY počítáme teoretickou potenciální hodnotu na základě parametrů strategie
            var repaymentCzk = loan.RepaymentAmountCzk;
            var targetTotalValueCzk = repaymentCzk * (1 + smartDist.TargetProfitPercent / 100m);

            _logger.LogInformation(
                "SmartDistribution calculation: RepaymentCzk={RepaymentCzk}, TargetProfitPercent={TargetProfitPercent}, TargetTotalValueCzk={TargetTotalValueCzk}",
                repaymentCzk, smartDist.TargetProfitPercent, targetTotalValueCzk);

            return targetTotalValueCzk;
        }

        private decimal CalculateCustomLadderPotentialValue(Loan loan, CustomLadderExitStrategy customLadder)
        {
            _logger.LogInformation("[Loan {LoanId}] CalculateCustomLadderPotentialValue called", loan.Id);
            
            if (customLadder.Orders?.Any() != true)
            {
                _logger.LogWarning("[Loan {LoanId}] CustomLadder has no orders, falling back to sell orders calculation", loan.Id);
                return CalculatePotentialValueFromSellOrders(loan);
            }

            var totalAvailableBtc = CalculateAvailableBtcForStrategy(loan);
            _logger.LogInformation("[Loan {LoanId}] Total available BTC: {TotalAvailableBtc}", loan.Id, totalAvailableBtc);
            
            decimal totalValueFromOrders = 0m;
            decimal totalBtcUsed = 0m;
            decimal highestTargetPrice = 0m;

            _logger.LogInformation("[Loan {LoanId}] Processing {OrderCount} CustomLadder orders", loan.Id, customLadder.Orders.Count);
            
            foreach (var order in customLadder.Orders)
            {
                var btcAmount = totalAvailableBtc * (order.PercentToSell / 100m);
                var orderValue = btcAmount * order.TargetPriceCzk;
                
                _logger.LogInformation("[Loan {LoanId}] Order: {PercentToSell}% at {TargetPrice} CZK/BTC = {BtcAmount} BTC = {OrderValue} CZK", 
                    loan.Id, order.PercentToSell, order.TargetPriceCzk, btcAmount, orderValue);
                    
                totalValueFromOrders += orderValue;
                totalBtcUsed += btcAmount;
                highestTargetPrice = Math.Max(highestTargetPrice, order.TargetPriceCzk);
            }

            _logger.LogInformation("[Loan {LoanId}] Total from orders: {TotalValueFromOrders} CZK, BTC used: {TotalBtcUsed}, Highest price: {HighestTargetPrice}", 
                loan.Id, totalValueFromOrders, totalBtcUsed, highestTargetPrice);

            // Přidej hodnotu zbývajícího BTC při nejvyšší ceně z ladder
            var remainingBtc = Math.Max(0m, totalAvailableBtc - totalBtcUsed);
            var remainingBtcValue = 0m;
            
            if (remainingBtc > 0 && highestTargetPrice > 0)
            {
                remainingBtcValue = remainingBtc * highestTargetPrice;
                totalValueFromOrders += remainingBtcValue;
                
                _logger.LogInformation("[Loan {LoanId}] Remaining BTC: {RemainingBtc} at {HighestPrice} = {RemainingBtcValue} CZK", 
                    loan.Id, remainingBtc, highestTargetPrice, remainingBtcValue);
            }

            _logger.LogInformation("[Loan {LoanId}] Final CustomLadder potential value: {TotalValue} CZK", loan.Id, totalValueFromOrders);
            return totalValueFromOrders;
        }

        private decimal CalculatePotentialValueFromSellOrders(Loan loan)
        {
            _logger.LogInformation("[Loan {LoanId}] CalculatePotentialValueFromSellOrders called", loan.Id);
            
            if (loan.SellOrders == null)
            {
                _logger.LogInformation("[Loan {LoanId}] No sell orders found, returning 0", loan.Id);
                return 0m;
            }

            var plannedOrders = loan.SellOrders
                .Where(so => so.Status == SellOrderStatus.Planned ||
                            so.Status == SellOrderStatus.Submitted ||
                            so.Status == SellOrderStatus.PartiallyFilled)
                .ToList();
                
            var totalValue = plannedOrders.Sum(so => so.TotalCzk);
            
            _logger.LogInformation("[Loan {LoanId}] Found {OrderCount} planned/submitted/partially-filled orders with total value: {TotalValue} CZK", 
                loan.Id, plannedOrders.Count, totalValue);
                
            foreach (var order in plannedOrders)
            {
                _logger.LogInformation("[Loan {LoanId}] Order: {BtcAmount} BTC at {PricePerBtc} CZK/BTC = {TotalCzk} CZK (Status: {Status})", 
                    loan.Id, order.BtcAmount, order.PricePerBtc, order.TotalCzk, order.Status);
            }

            return totalValue;
        }

        private decimal CalculateBtcInPlannedOrders(Loan loan)
        {
            if (loan.SellOrders == null)
            {
                return 0m;
            }

            return loan.SellOrders
                .Where(so => so.Status == SellOrderStatus.Planned ||
                            so.Status == SellOrderStatus.Submitted ||
                            so.Status == SellOrderStatus.PartiallyFilled)
                .Sum(so => so.BtcAmount);
        }

        private ExitStrategyBase? DeserializeStrategy(string strategyJson)
        {
            try
            {
                return JsonConvert.DeserializeObject<ExitStrategyBase>(strategyJson, new JsonSerializerSettings
                {
                    TypeNameHandling = TypeNameHandling.Auto
                });
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private decimal CalculateEquidistantLadderPotentialValue(Loan loan, EquidistantLadderExitStrategy equidistant)
        {
            _logger.LogInformation("[Loan {LoanId}] CalculateEquidistantLadderPotentialValue called", loan.Id);
            
            if (equidistant.OrderCount <= 0)
            {
                _logger.LogWarning("[Loan {LoanId}] EquidistantLadder has invalid OrderCount, falling back to sell orders calculation", loan.Id);
                return CalculatePotentialValueFromSellOrders(loan);
            }

            var totalAvailableBtc = CalculateAvailableBtcForStrategy(loan);
            _logger.LogInformation("[Loan {LoanId}] Total available BTC: {TotalAvailableBtc}", loan.Id, totalAvailableBtc);
            
            if (totalAvailableBtc <= 0.00000001m)
            {
                _logger.LogInformation("[Loan {LoanId}] No available BTC", loan.Id);
                return 0m;
            }

            // Výpočet cenového rozsahu
            decimal startPrice = equidistant.StartPriceCzk;
            decimal endPrice = equidistant.EndPriceCzk;
            int orderCount = equidistant.OrderCount;

            // Zajistit správné pořadí cen
            if (startPrice > endPrice)
            {
                (startPrice, endPrice) = (endPrice, startPrice);
            }

            // Pro EquidistantLadder se používá vždy 100% dostupného BTC
            // Generování cen - rovnoměrné rozložení
            var prices = new List<decimal>();
            if (orderCount == 1)
            {
                prices.Add((startPrice + endPrice) / 2m);
            }
            else
            {
                for (int i = 0; i < orderCount; i++)
                {
                    decimal priceRatio = (decimal)i / (orderCount - 1);
                    decimal price = startPrice + (endPrice - startPrice) * priceRatio;
                    prices.Add(Math.Round(price / 1000m) * 1000m); // Zaokrouhlení na tisíce
                }
            }

            // Generování množství BTC podle distribučního typu
            var btcAmounts = CalculateBtcDistribution(totalAvailableBtc, orderCount, equidistant.DistributionType);

            decimal totalValue = 0m;
            for (int i = 0; i < Math.Min(prices.Count, btcAmounts.Count); i++)
            {
                decimal orderValue = btcAmounts[i] * prices[i];
                totalValue += orderValue;
                
                _logger.LogInformation("[Loan {LoanId}] Order {Index}: {BtcAmount} BTC at {Price} CZK/BTC = {OrderValue} CZK", 
                    loan.Id, i, btcAmounts[i], prices[i], orderValue);
            }

            _logger.LogInformation("[Loan {LoanId}] Final EquidistantLadder potential value: {TotalValue} CZK", loan.Id, totalValue);
            return totalValue;
        }

        private decimal CalculateEquifrequentLadderPotentialValue(Loan loan, EquifrequentLadderExitStrategy equifrequent)
        {
            _logger.LogInformation("[Loan {LoanId}] CalculateEquifrequentLadderPotentialValue called", loan.Id);
            
            if (equifrequent.OrderCount <= 0)
            {
                _logger.LogWarning("[Loan {LoanId}] EquifrequentLadder has invalid OrderCount, falling back to sell orders calculation", loan.Id);
                return CalculatePotentialValueFromSellOrders(loan);
            }

            var totalAvailableBtc = CalculateAvailableBtcForStrategy(loan);
            _logger.LogInformation("[Loan {LoanId}] Total available BTC: {TotalAvailableBtc}", loan.Id, totalAvailableBtc);
            
            if (totalAvailableBtc <= 0.00000001m)
            {
                _logger.LogInformation("[Loan {LoanId}] No available BTC", loan.Id);
                return 0m;
            }

            // Výpočet množství BTC na každý order
            decimal btcPerOrder = (equifrequent.BtcPercentPerOrder / 100m) * totalAvailableBtc;
            
            if (btcPerOrder <= 0.00000001m)
            {
                _logger.LogInformation("[Loan {LoanId}] BTC per order too small", loan.Id);
                return 0m;
            }

            // Zkontrolovat, že celkové procento nepřekračuje 100%
            decimal totalPercentUsed = equifrequent.BtcPercentPerOrder * equifrequent.OrderCount;
            if (totalPercentUsed > 100m)
            {
                // Upravit množství BTC na order aby se nepřekročilo 100%
                btcPerOrder = totalAvailableBtc / equifrequent.OrderCount;
                totalPercentUsed = 100m;
            }

            _logger.LogInformation("[Loan {LoanId}] BTC per order: {BtcPerOrder}, Total percent used: {TotalPercentUsed}%", 
                loan.Id, btcPerOrder, totalPercentUsed);

            // Generování cen s rostoucím procentuálním přírůstkem
            decimal basePrice = equifrequent.BasePriceCzk;
            decimal incrementPercent = equifrequent.PriceIncrementPercent / 100m;

            decimal totalValueFromOrders = 0m;
            decimal totalBtcUsed = 0m;
            decimal highestPrice = basePrice;

            for (int i = 0; i < equifrequent.OrderCount; i++)
            {
                // Cena pro i-tý order: basePrice * (1 + incrementPercent)^i
                decimal orderPrice = basePrice * (decimal)Math.Pow((double)(1m + incrementPercent), i);
                orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                highestPrice = Math.Max(highestPrice, orderPrice);

                decimal actualBtcAmount = btcPerOrder;
                
                // Pro poslední order použít zbývající BTC pokud je totalPercent <= 100%
                if (i == equifrequent.OrderCount - 1 && totalPercentUsed <= 100m)
                {
                    decimal usedBtc = btcPerOrder * i;
                    decimal maxUsableBtc = totalAvailableBtc * Math.Min(totalPercentUsed, 100m) / 100m;
                    actualBtcAmount = Math.Max(0m, maxUsableBtc - usedBtc);
                }

                if (actualBtcAmount <= 0.00000001m)
                {
                    continue;
                }

                decimal orderValue = actualBtcAmount * orderPrice;
                totalValueFromOrders += orderValue;
                totalBtcUsed += actualBtcAmount;
                
                _logger.LogInformation("[Loan {LoanId}] Order {Index}: {BtcAmount} BTC at {Price} CZK/BTC = {OrderValue} CZK", 
                    loan.Id, i, actualBtcAmount, orderPrice, orderValue);
            }

            // Přidej hodnotu zbývajícího BTC při nejvyšší ceně
            var remainingBtc = Math.Max(0m, totalAvailableBtc - totalBtcUsed);
            var remainingBtcValue = 0m;
            
            if (remainingBtc > 0.00000001m && highestPrice > 0)
            {
                remainingBtcValue = remainingBtc * highestPrice;
                totalValueFromOrders += remainingBtcValue;
                
                _logger.LogInformation("[Loan {LoanId}] Remaining BTC: {RemainingBtc} at highest price {HighestPrice} = {RemainingBtcValue} CZK", 
                    loan.Id, remainingBtc, highestPrice, remainingBtcValue);
            }

            _logger.LogInformation("[Loan {LoanId}] Final EquifrequentLadder potential value: {TotalValue} CZK (from orders: {OrdersValue}, from remaining: {RemainingValue})", 
                loan.Id, totalValueFromOrders, totalValueFromOrders - remainingBtcValue, remainingBtcValue);
            
            return totalValueFromOrders;
        }

        private List<decimal> CalculateBtcDistribution(decimal totalBtc, int orderCount, DistributionType distributionType)
        {
            var amounts = new List<decimal>();

            switch (distributionType)
            {
                case DistributionType.EQUAL:
                    // Rovnoměrné rozdělení
                    decimal equalAmount = totalBtc / orderCount;
                    for (int i = 0; i < orderCount; i++)
                    {
                        amounts.Add(equalAmount);
                    }
                    break;

                case DistributionType.DECREASING:
                    // Klesající množství - více BTC při nižších cenách
                    decimal totalWeight = 0;
                    for (int i = 0; i < orderCount; i++)
                    {
                        totalWeight += orderCount - i; // Váhy: n, n-1, n-2, ..., 1
                    }
                    
                    for (int i = 0; i < orderCount; i++)
                    {
                        decimal weight = orderCount - i;
                        decimal amount = totalBtc * (weight / totalWeight);
                        amounts.Add(amount);
                    }
                    break;

                case DistributionType.INCREASING:
                    // Rostoucí množství - více BTC při vyšších cenách
                    totalWeight = 0;
                    for (int i = 0; i < orderCount; i++)
                    {
                        totalWeight += i + 1; // Váhy: 1, 2, 3, ..., n
                    }
                    
                    for (int i = 0; i < orderCount; i++)
                    {
                        decimal weight = i + 1;
                        decimal amount = totalBtc * (weight / totalWeight);
                        amounts.Add(amount);
                    }
                    break;

                default:
                    // Fallback na rovnoměrné rozdělení
                    equalAmount = totalBtc / orderCount;
                    for (int i = 0; i < orderCount; i++)
                    {
                        amounts.Add(equalAmount);
                    }
                    break;
            }

            return amounts;
        }
    }
} 