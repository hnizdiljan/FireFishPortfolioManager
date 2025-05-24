using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Interface pro generování sell orderů podle různých strategií.
    /// Implementuje Strategy Pattern pro lepší rozšiřitelnost.
    /// </summary>
    public interface ISellOrderGenerator
    {
        /// <summary>
        /// Typ strategie, kterou tento generátor obsluhuje
        /// </summary>
        ExitStrategyType SupportedStrategyType { get; }
        
        /// <summary>
        /// Generuje sell ordery pro danou strategii
        /// </summary>
        /// <param name="loan">Půjčka pro kterou se generují ordery</param>
        /// <param name="strategy">Strategie (musí odpovídat SupportedStrategyType)</param>
        /// <param name="currentBtcPrice">Aktuální cena BTC</param>
        /// <returns>Seznam sell orderů</returns>
        List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice);
        
        /// <summary>
        /// Ověří, zda je strategie validní
        /// </summary>
        /// <param name="strategy">Strategie k ověření</param>
        /// <param name="error">Popis chyby pokud není validní</param>
        /// <returns>True pokud je strategie validní</returns>
        bool ValidateStrategy(ExitStrategyBase strategy, out string? error);
    }
} 