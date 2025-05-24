using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services.Strategies
{
    /// <summary>
    /// Generátor sell orderů pro HODL strategii.
    /// HODL: Při splatnosti se prodá potřebné množství BTC na splacení půjčky.
    /// </summary>
    public class HodlSellOrderGenerator : ISellOrderGenerator
    {
        public ExitStrategyType SupportedStrategyType => ExitStrategyType.HODL;

        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy is not HodlExitStrategy)
            {
                throw new ArgumentException($"Strategy must be of type {nameof(HodlExitStrategy)}", nameof(strategy));
            }

            // HODL: při splatnosti prodej potřebného množství BTC na splacení
            var calculatedBTC = loan.RepaymentAmountCzk / currentBtcPrice;
            var btcToSell = Math.Max(loan.PurchasedBtc, calculatedBTC);

            return new List<SellOrder>
            {
                new SellOrder
                {
                    LoanId = loan.Id,
                    BtcAmount = btcToSell,
                    PricePerBtc = currentBtcPrice,
                    TotalCzk = btcToSell * currentBtcPrice,
                    Status = SellOrderStatus.Planned
                }
            };
        }

        public bool ValidateStrategy(ExitStrategyBase strategy, out string? error)
        {
            error = null;
            
            if (strategy is not HodlExitStrategy)
            {
                error = $"Strategy must be of type {nameof(HodlExitStrategy)}";
                return false;
            }

            // HODL strategie nemá žádné parametry k validaci
            return true;
        }
    }
} 