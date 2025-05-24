using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services.Strategies
{
    /// <summary>
    /// Generátor sell orderů pro Custom Ladder strategii.
    /// Custom Ladder: Uživatelsky definované prodejní úrovně (cenu a procento BTC k prodeji).
    /// </summary>
    public class CustomLadderSellOrderGenerator : ISellOrderGenerator
    {
        public ExitStrategyType SupportedStrategyType => ExitStrategyType.CustomLadder;

        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy is not CustomLadderExitStrategy customStrategy)
            {
                throw new ArgumentException($"Strategy must be of type {nameof(CustomLadderExitStrategy)}", nameof(strategy));
            }

            var orders = new List<SellOrder>();
            
            if (customStrategy.Orders?.Any() == true)
            {
                var availableBtc = loan.PurchasedBtc - loan.FeesBtc - loan.TransactionFeesBtc;
                
                foreach (var order in customStrategy.Orders)
                {
                    var btcAmount = availableBtc * (order.PercentToSell / 100m);
                    
                    if (btcAmount > 0.00000001m) // Pouze pokud je množství větší než minimální threshold
                    {
                        orders.Add(new SellOrder
                        {
                            LoanId = loan.Id,
                            BtcAmount = btcAmount,
                            PricePerBtc = order.TargetPriceCzk,
                            TotalCzk = btcAmount * order.TargetPriceCzk,
                            Status = SellOrderStatus.Planned
                        });
                    }
                }
            }
            
            return orders;
        }

        public bool ValidateStrategy(ExitStrategyBase strategy, out string? error)
        {
            error = null;
            
            if (strategy is not CustomLadderExitStrategy customStrategy)
            {
                error = $"Strategy must be of type {nameof(CustomLadderExitStrategy)}";
                return false;
            }

            if (customStrategy.Orders == null || !customStrategy.Orders.Any())
            {
                error = "Custom Ladder strategie musí obsahovat alespoň jeden order.";
                return false;
            }

            // Validace jednotlivých orderů
            foreach (var order in customStrategy.Orders)
            {
                if (order.TargetPriceCzk <= 0)
                {
                    error = "Všechny ceny musí být kladné.";
                    return false;
                }

                if (order.PercentToSell <= 0 || order.PercentToSell > 100)
                {
                    error = "Procenta k prodeji musí být v rozsahu 1-100%.";
                    return false;
                }
            }

            // Validace celkového součtu procent
            var totalPercent = customStrategy.Orders.Sum(o => o.PercentToSell);
            if (totalPercent > 100m)
            {
                error = $"Celkový součet procent nesmí přesáhnout 100% (aktuálně {totalPercent:F2}%).";
                return false;
            }

            return true;
        }
    }
} 