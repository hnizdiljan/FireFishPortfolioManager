using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Interface pro kalkulace související s půjčkami.
    /// Implementuje Single Responsibility Principle pro calculation logiku.
    /// </summary>
    public interface ILoanCalculationService
    {
        /// <summary>
        /// Vypočítá potenciální hodnotu půjčky na základě její strategie
        /// </summary>
        /// <param name="loan">Půjčka</param>
        /// <returns>Potenciální hodnota v CZK</returns>
        decimal CalculatePotentialValueCzk(Loan loan);
        
        /// <summary>
        /// Vypočítá celkové dostupné BTC pro strategii
        /// </summary>
        /// <param name="loan">Půjčka</param>
        /// <returns>Dostupné BTC pro strategii</returns>
        decimal CalculateAvailableBtcForStrategy(Loan loan);
        
        /// <summary>
        /// Vypočítá zbývající BTC po aplikaci strategie
        /// </summary>
        /// <param name="loan">Půjčka</param>
        /// <returns>Zbývající BTC po strategii</returns>
        decimal CalculateRemainingBtcAfterStrategy(Loan loan);
    }
} 