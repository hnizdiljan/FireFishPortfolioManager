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
                        decimal profitCzk = loan.LoanAmountCzk * (smart.TargetProfitPercent / 100m);
                        decimal totalCzk = loan.LoanAmountCzk + profitCzk;
                        decimal btcToSell = totalCzk / currentBtcPrice;
                        decimal btcPerOrder = btcToSell / smart.OrderCount;
                        for (int i = 0; i < smart.OrderCount; i++)
                        {
                            var price = currentBtcPrice + i * (profitCzk / smart.OrderCount); // jednoduchá lineární distribuce
                            smartOrders.Add(new SellOrder
                            {
                                LoanId = loan.Id,
                                BtcAmount = btcPerOrder,
                                PricePerBtc = price,
                                TotalCzk = btcPerOrder * price,
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