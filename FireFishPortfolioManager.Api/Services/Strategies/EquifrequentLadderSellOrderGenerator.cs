using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services.Strategies
{
    /// <summary>
    /// Generátor sell orderů pro Equifrequent Ladder strategii.
    /// Equifrequent Ladder: Žebřík s intervaly čekajícími na určité procento nárůstu. Každá úroveň je o zadané procento vyšší než předchozí.
    /// </summary>
    public class EquifrequentLadderSellOrderGenerator : ISellOrderGenerator
    {
        public ExitStrategyType SupportedStrategyType => ExitStrategyType.EquifrequentLadder;

        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy is not EquifrequentLadderExitStrategy equifrequentStrategy)
            {
                throw new ArgumentException($"Strategy must be of type {nameof(EquifrequentLadderExitStrategy)}", nameof(strategy));
            }

            var orders = new List<SellOrder>();
            
            if (equifrequentStrategy.OrderCount <= 0)
            {
                return orders; // Žádné ordery pokud není zadán počet
            }

            decimal availableBtc = loan.PurchasedBtc - loan.FeesBtc - loan.TransactionFeesBtc;
            
            if (availableBtc <= 0.00000001m)
            {
                return orders; // Prázdný seznam pokud není co prodat
            }

            // Výpočet množství BTC na každý order
            decimal btcPerOrder = (equifrequentStrategy.BtcPercentPerOrder / 100m) * availableBtc;
            
            if (btcPerOrder <= 0.00000001m)
            {
                return orders; // Příliš malé množství BTC na order
            }

            // Zkontrolovat, že celkové procento nepřekračuje 100%
            decimal totalPercentUsed = equifrequentStrategy.BtcPercentPerOrder * equifrequentStrategy.OrderCount;
            if (totalPercentUsed > 100m)
            {
                // Upravit množství BTC na order aby se nepřekročilo 100%
                btcPerOrder = availableBtc / equifrequentStrategy.OrderCount;
            }

            // Generování cen s rostoucím procentuálním přírůstkem
            decimal basePrice = equifrequentStrategy.BasePriceCzk;
            decimal incrementPercent = equifrequentStrategy.PriceIncrementPercent / 100m;

            for (int i = 0; i < equifrequentStrategy.OrderCount; i++)
            {
                // Cena pro i-tý order: basePrice * (1 + incrementPercent)^i
                decimal orderPrice = basePrice * (decimal)Math.Pow((double)(1m + incrementPercent), i);
                
                // Zaokrouhlení na tisíce
                orderPrice = Math.Round(orderPrice / 1000m) * 1000m;

                // Zajistit minimální cenu
                orderPrice = Math.Max(orderPrice, currentBtcPrice * 1.01m); // Min +1% nad současnou cenu

                decimal actualBtcAmount = btcPerOrder;
                
                // Pro poslední order použít zbývající BTC pokud je totalPercent <= 100%
                if (i == equifrequentStrategy.OrderCount - 1 && totalPercentUsed <= 100m)
                {
                    decimal usedBtc = btcPerOrder * i;
                    decimal maxUsableBtc = availableBtc * Math.Min(totalPercentUsed, 100m) / 100m;
                    actualBtcAmount = Math.Max(0m, maxUsableBtc - usedBtc);
                }

                if (actualBtcAmount <= 0.00000001m)
                {
                    continue;
                }

                orders.Add(new SellOrder
                {
                    LoanId = loan.Id,
                    BtcAmount = actualBtcAmount,
                    PricePerBtc = orderPrice,
                    TotalCzk = actualBtcAmount * orderPrice,
                    Status = SellOrderStatus.Planned
                });
            }
            
            return orders;
        }

        public bool ValidateStrategy(ExitStrategyBase strategy, out string? error)
        {
            error = null;
            
            if (strategy is not EquifrequentLadderExitStrategy equifrequentStrategy)
            {
                error = $"Strategy must be of type {nameof(EquifrequentLadderExitStrategy)}";
                return false;
            }

            if (equifrequentStrategy.BasePriceCzk <= 0)
            {
                error = "Základní cena musí být kladná.";
                return false;
            }

            if (equifrequentStrategy.PriceIncrementPercent <= 0)
            {
                error = "Procento nárůstu musí být kladné.";
                return false;
            }

            if (equifrequentStrategy.PriceIncrementPercent > 100)
            {
                error = "Procento nárůstu nesmí překročit 100%.";
                return false;
            }

            if (equifrequentStrategy.OrderCount <= 0)
            {
                error = "Počet orderů musí být alespoň 1.";
                return false;
            }

            if (equifrequentStrategy.OrderCount > 50)
            {
                error = "Počet orderů nesmí překročit 50.";
                return false;
            }

            if (equifrequentStrategy.BtcPercentPerOrder <= 0)
            {
                error = "Procento BTC na order musí být kladné.";
                return false;
            }

            if (equifrequentStrategy.BtcPercentPerOrder > 100)
            {
                error = "Procento BTC na order nesmí překročit 100%.";
                return false;
            }

            // Varování pokud celkové procento překračuje 100%
            decimal totalPercent = equifrequentStrategy.BtcPercentPerOrder * equifrequentStrategy.OrderCount;
            if (totalPercent > 100)
            {
                error = $"Celkové procento BTC ({totalPercent:F1}%) překračuje 100%. Množství bude automaticky upraveno.";
                // Nejedná se o chybu, jen varování - strategie bude fungovat s upraveným množstvím
                return true;
            }

            return true;
        }
    }
} 