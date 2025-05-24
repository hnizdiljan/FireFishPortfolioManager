using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services.Strategies
{
    /// <summary>
    /// Generátor sell orderů pro Equidistant Ladder strategii.
    /// Equidistant Ladder: Automaticky vytvoří žebřík s rovnoměrně rozloženými cenami mezi počáteční a konečnou cenou.
    /// </summary>
    public class EquidistantLadderSellOrderGenerator : ISellOrderGenerator
    {
        public ExitStrategyType SupportedStrategyType => ExitStrategyType.EquidistantLadder;

        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy is not EquidistantLadderExitStrategy equidistantStrategy)
            {
                throw new ArgumentException($"Strategy must be of type {nameof(EquidistantLadderExitStrategy)}", nameof(strategy));
            }

            var orders = new List<SellOrder>();
            
            if (equidistantStrategy.OrderCount <= 0)
            {
                return orders; // Žádné ordery pokud není zadán počet
            }

            decimal availableBtc = loan.PurchasedBtc - loan.FeesBtc - loan.TransactionFeesBtc;
            
            if (availableBtc <= 0.00000001m)
            {
                return orders; // Prázdný seznam pokud není co prodat
            }

            // Výpočet cenového rozsahu
            decimal startPrice = equidistantStrategy.StartPriceCzk;
            decimal endPrice = equidistantStrategy.EndPriceCzk;
            int orderCount = equidistantStrategy.OrderCount;

            // Zajistit správné pořadí cen
            if (startPrice > endPrice)
            {
                (startPrice, endPrice) = (endPrice, startPrice);
            }

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
            var btcAmounts = CalculateBtcDistribution(availableBtc, orderCount, equidistantStrategy.DistributionType);

            // Vytvoření sell orderů
            for (int i = 0; i < orderCount && i < prices.Count && i < btcAmounts.Count; i++)
            {
                decimal btcAmount = btcAmounts[i];
                decimal price = prices[i];

                if (btcAmount <= 0.00000001m)
                {
                    continue;
                }

                orders.Add(new SellOrder
                {
                    LoanId = loan.Id,
                    BtcAmount = btcAmount,
                    PricePerBtc = price,
                    TotalCzk = btcAmount * price,
                    Status = SellOrderStatus.Planned
                });
            }
            
            return orders;
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

        public bool ValidateStrategy(ExitStrategyBase strategy, out string? error)
        {
            error = null;
            
            if (strategy is not EquidistantLadderExitStrategy equidistantStrategy)
            {
                error = $"Strategy must be of type {nameof(EquidistantLadderExitStrategy)}";
                return false;
            }

            if (equidistantStrategy.StartPriceCzk <= 0)
            {
                error = "Počáteční cena musí být kladná.";
                return false;
            }

            if (equidistantStrategy.EndPriceCzk <= 0)
            {
                error = "Konečná cena musí být kladná.";
                return false;
            }

            if (equidistantStrategy.OrderCount <= 0)
            {
                error = "Počet orderů musí být alespoň 1.";
                return false;
            }

            if (equidistantStrategy.OrderCount > 100)
            {
                error = "Počet orderů nesmí překročit 100.";
                return false;
            }

            return true;
        }
    }
} 