using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Factory pro vytváření a správu sell order generátorů.
    /// Implementuje Factory Pattern pro lepší rozšiřitelnost.
    /// </summary>
    public interface ISellOrderGeneratorFactory
    {
        /// <summary>
        /// Získá generátor pro daný typ strategie
        /// </summary>
        /// <param name="strategyType">Typ strategie</param>
        /// <returns>Generátor pro daný typ strategie</returns>
        /// <exception cref="NotSupportedException">Pokud typ strategie není podporován</exception>
        ISellOrderGenerator GetGenerator(ExitStrategyType strategyType);
        
        /// <summary>
        /// Získá seznam všech podporovaných typů strategií
        /// </summary>
        /// <returns>Seznam podporovaných typů strategií</returns>
        IEnumerable<ExitStrategyType> GetSupportedStrategyTypes();
        
        /// <summary>
        /// Ověří, zda je daný typ strategie podporován
        /// </summary>
        /// <param name="strategyType">Typ strategie</param>
        /// <returns>True pokud je typ strategie podporován</returns>
        bool IsStrategySupported(ExitStrategyType strategyType);
    }
} 