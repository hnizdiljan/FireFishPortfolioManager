using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services.Strategies
{
    /// <summary>
    /// Generátor sell orderů pro Smart Distribution strategii.
    /// Smart Distribution: Automaticky rozdělí prodej BTC podle cílového zisku a preference poměru BTC/CZK profitu.
    /// </summary>
    public class SmartDistributionSellOrderGenerator : ISellOrderGenerator
    {
        public ExitStrategyType SupportedStrategyType => ExitStrategyType.SmartDistribution;

        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy is not SmartDistributionExitStrategy smartStrategy)
            {
                throw new ArgumentException($"Strategy must be of type {nameof(SmartDistributionExitStrategy)}", nameof(strategy));
            }

            var orders = new List<SellOrder>();
            
            if (smartStrategy.OrderCount <= 0)
            {
                return orders; // Žádné ordery pokud není zadán počet
            }

            // Základní výpočty podle oficiálního popisu SmartDistribution
            // Cílový zisk se počítá vůči "částce ke splacení" dané půjčky
            decimal repaymentCzk = loan.RepaymentAmountCzk;
            decimal targetTotalValue = repaymentCzk * (1 + smartStrategy.TargetProfitPercent / 100m);
            decimal totalProfitCzk = targetTotalValue - repaymentCzk;
            
            // BTC na profit (%) určuje poměr, jak velká část profitu má být uložena v BTC
            // 100% = veškerý profit v BTC, sell ordery pokryjí pouze "částku ke splacení"
            // 0% = chceme utratit veškerý nakoupený BTC, veškerý profit bude v CZK
            decimal profitFromCzk = totalProfitCzk * (1 - smartStrategy.BtcProfitRatioPercent / 100m);
            
            // Sell ordery mají generovat: repayment + profit který má být v CZK
            decimal targetCzkFromSellOrders = repaymentCzk + profitFromCzk;
            
            decimal availableBtc = loan.PurchasedBtc - loan.FeesBtc - loan.TransactionFeesBtc;
            
            // Odhad kolik BTC potřebujeme na sell ordery (při současné ceně jako aproximace)
            decimal estimatedBtcForSellOrders = targetCzkFromSellOrders / currentBtcPrice;
            
            // Zajistit, že nemáme více BTC na sell ordery než je dostupné
            decimal btcForSellOrders = Math.Min(estimatedBtcForSellOrders, availableBtc * 0.99m); // Max 99% pro bezpečnost
            
            if (btcForSellOrders <= 0.00000001m)
            {
                return orders; // Prázdný seznam pokud není co prodat
            }

            decimal btcPerOrder = btcForSellOrders / smartStrategy.OrderCount;

            // Výpočet cenového rozsahu
            // Potřebujeme ceny tak, aby průměrná cena = targetCzkFromSellOrders / btcForSellOrders
            decimal targetAvgPrice = targetCzkFromSellOrders / btcForSellOrders;
            
            // Vytvoření cenového rozsahu kolem průměrné ceny
            decimal priceSpreadPercent = 0.4m; // +/-40% rozptyl kolem průměru
            decimal minPrice = targetAvgPrice * (1 - priceSpreadPercent);
            decimal maxPrice = targetAvgPrice * (1 + priceSpreadPercent);
            
            // Zajistit rozumné minimální ceny
            minPrice = Math.Max(minPrice, currentBtcPrice * 1.05m); // Min +5% nad současnou cenu
            maxPrice = Math.Max(maxPrice, minPrice * 1.2m); // Min 20% rozptyl
            
            // Generování orderů
            for (int i = 0; i < smartStrategy.OrderCount; i++)
            {
                decimal priceMultiplier = smartStrategy.OrderCount == 1 ? 0.5m : (decimal)i / (smartStrategy.OrderCount - 1);
                decimal orderPrice = minPrice + (maxPrice - minPrice) * priceMultiplier;
                
                // Zaokrouhlení na tisíce
                orderPrice = Math.Round(orderPrice / 1000m) * 1000m;
                orderPrice = Math.Max(orderPrice, currentBtcPrice * 1.05m);

                decimal actualBtcAmount = (i == smartStrategy.OrderCount - 1)
                    ? btcForSellOrders - orders.Sum(o => o.BtcAmount) // Poslední order bere zbytek
                    : btcPerOrder;
                    
                actualBtcAmount = Math.Max(0m, actualBtcAmount);

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
            
            if (strategy is not SmartDistributionExitStrategy smartStrategy)
            {
                error = $"Strategy must be of type {nameof(SmartDistributionExitStrategy)}";
                return false;
            }

            if (smartStrategy.TargetProfitPercent <= 0)
            {
                error = "Cílový zisk musí být kladný.";
                return false;
            }

            if (smartStrategy.OrderCount <= 0)
            {
                error = "Počet orderů musí být alespoň 1.";
                return false;
            }

            if (smartStrategy.BtcProfitRatioPercent < 0 || smartStrategy.BtcProfitRatioPercent > 100)
            {
                error = "BTC profit ratio musí být v rozsahu 0-100%.";
                return false;
            }

            return true;
        }
    }
} 