using System;
using System.Collections.Generic;
using System.Linq;
using FireFishPortfolioManager.Api.Models;
using Newtonsoft.Json;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Services
{
    public class ExitStrategyService
    {
        public List<SellOrder> GenerateSellOrders(Loan loan, decimal currentBtcPrice)
        {
            if (string.IsNullOrEmpty(loan.StrategyJson))
            {
                // Strategie není nastavena, vracíme prázdný seznam (UI může zobrazit info)
                return new List<SellOrder>();
            }

            // Zjisti typ strategie
            var baseStrategy = JsonConvert.DeserializeObject<ExitStrategyBase>(loan.StrategyJson, new JsonSerializerSettings
            {
                TypeNameHandling = TypeNameHandling.Auto
            });

            if (baseStrategy == null)
            {
                throw new InvalidOperationException("Strategie nelze deserializovat.");
            }

            switch (baseStrategy.Type)
            {
                case ExitStrategyType.HODL:
                    // HODL: při splatnosti prodej potřebného množství BTC na splacení
                    var calculatedBTC = loan.RepaymentAmountCzk / currentBtcPrice;

                    return new List<SellOrder>
                    {
                        new SellOrder
                        {
                            LoanId = loan.Id,
                            BtcAmount = Math.Max(loan.PurchasedBtc, calculatedBTC),
                            PricePerBtc = currentBtcPrice,
                            TotalCzk = Math.Max(loan.PurchasedBtc, calculatedBTC) * currentBtcPrice,
                            Status = SellOrderStatus.Planned
                        }
                    };
                case ExitStrategyType.CustomLadder:
                    // Custom Ladder: uživatelsky definované ordery
                    var custom = JsonConvert.DeserializeObject<CustomLadderExitStrategy>(loan.StrategyJson);
                    var orders = new List<SellOrder>();
                    if (custom?.Orders != null)
                    {
                        foreach (var o in custom.Orders)
                        {
                            var btcAmount = loan.PurchasedBtc * (o.PercentToSell / 100m);
                            orders.Add(new SellOrder
                            {
                                LoanId = loan.Id,
                                BtcAmount = btcAmount,
                                PricePerBtc = o.TargetPriceCzk,
                                TotalCzk = btcAmount * o.TargetPriceCzk,
                                Status = SellOrderStatus.Planned
                            });
                        }
                    }
                    return orders;
                case ExitStrategyType.SmartDistribution:
                    // Smart Distribution: automatické rozdělení orderů
                    var smart = JsonConvert.DeserializeObject<SmartDistributionExitStrategy>(loan.StrategyJson);
                    var smartOrders = new List<SellOrder>();
                    if (smart?.OrderCount > 0)
                    {
                        // Výpočet cílové ceny na základě cílového zisku
                        decimal targetProfitPercent = smart.TargetProfitPercent;
                        decimal targetTotalValue = loan.RepaymentAmountCzk * (1 + targetProfitPercent / 100m);
                        decimal availableBtc = loan.PurchasedBtc - loan.FeesBtc - loan.TransactionFeesBtc;
                        
                        // Průměrná cílová cena pro dosažení požadovaného zisku
                        decimal averageTargetPrice = targetTotalValue / availableBtc;
                        
                        // Vytvoření odstupňovaných cen
                        decimal priceRangePercent = 0.5m; // Rozptyl cen +/-50% kolem průměrné ceny
                        decimal minPrice = averageTargetPrice * (1 - priceRangePercent);
                        decimal maxPrice = averageTargetPrice * (1 + priceRangePercent);
                        
                        // Zajistit, že minimální cena není nižší než současná cena
                        minPrice = Math.Max(minPrice, currentBtcPrice * 1.1m); // Minimálně +10% nad současnou cenu
                        
                        // Pokud je rozsah příliš malý, zvětšíme ho
                        if (maxPrice - minPrice < currentBtcPrice * 0.2m)
                        {
                            maxPrice = minPrice + currentBtcPrice * 0.5m; // Minimální rozptyl 50% současné ceny
                        }
                        
                        decimal btcPerOrder = availableBtc / smart.OrderCount;
                        
                        for (int i = 0; i < smart.OrderCount; i++)
                        {
                            // Odstupňované ceny - lineární distribuce od min po max
                            decimal priceMultiplier = smart.OrderCount == 1 ? 0.5m : (decimal)i / (smart.OrderCount - 1);
                            decimal price = minPrice + (maxPrice - minPrice) * priceMultiplier;
                            
                            smartOrders.Add(new SellOrder
                            {
                                LoanId = loan.Id,
                                BtcAmount = btcPerOrder,
                                PricePerBtc = Math.Round(price, 0), // Zaokrouhlení na celé koruny
                                TotalCzk = btcPerOrder * Math.Round(price, 0),
                                Status = SellOrderStatus.Planned
                            });
                        }
                    }
                    return smartOrders;
                default:
                    throw new NotSupportedException($"Unknown exit strategy type: {baseStrategy.Type}");
            }
        }

        /// <summary>
        /// Validates a Custom Ladder strategy (sum of PercentToSell must be <= 100)
        /// </summary>
        public bool ValidateCustomLadderStrategy(CustomLadderExitStrategy strategy, out string? error)
        {
            error = null;
            if (strategy == null || strategy.Orders == null)
            {
                error = "Strategie nebo seznam orderů je prázdný.";
                return false;
            }
            var sum = strategy.Orders.Sum(o => o.PercentToSell);
            if (sum > 100m)
            {
                error = $"Celkový součet procent v Custom Ladder strategii nesmí přesáhnout 100 % (aktuálně {sum} %).";
                return false;
            }
            return true;
        }
    }
} 