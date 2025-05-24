using System;
using System.Collections.Generic;
using System.Linq;
using FireFishPortfolioManager.Api.Models;
using Newtonsoft.Json;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Refaktorovaná služba pro správu exit strategií.
    /// Používá Strategy Pattern a Factory Pattern pro lepší rozšiřitelnost.
    /// </summary>
    public class ExitStrategyService
    {
        private readonly ISellOrderGeneratorFactory _generatorFactory;

        public ExitStrategyService(ISellOrderGeneratorFactory generatorFactory)
        {
            _generatorFactory = generatorFactory ?? throw new ArgumentNullException(nameof(generatorFactory));
        }

        /// <summary>
        /// Generuje sell ordery pro danou půjčku podle její strategie
        /// </summary>
        public List<SellOrder> GenerateSellOrders(Loan loan, decimal currentBtcPrice)
        {
            if (string.IsNullOrEmpty(loan.StrategyJson))
            {
                // Strategie není nastavena, vracíme prázdný seznam (UI může zobrazit info)
                return new List<SellOrder>();
            }

            // Deserializace strategie
            var strategy = DeserializeStrategy(loan.StrategyJson);
            if (strategy == null)
            {
                throw new InvalidOperationException("Strategie nelze deserializovat.");
            }

            return GenerateSellOrders(loan, strategy, currentBtcPrice);
        }

        /// <summary>
        /// Generuje sell ordery pro danou půjčku podle zadané strategie
        /// </summary>
        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy == null)
            {
                throw new ArgumentNullException(nameof(strategy));
            }

            // Získání odpovídajícího generátoru a vytvoření orderů
            var generator = _generatorFactory.GetGenerator(strategy.Type);
            return generator.GenerateSellOrders(loan, strategy, currentBtcPrice);
        }

        /// <summary>
        /// Validuje strategii
        /// </summary>
        public bool ValidateStrategy(ExitStrategyBase strategy, out string? error)
        {
            error = null;
            
            if (strategy == null)
            {
                error = "Strategie je null.";
                return false;
            }

            if (!_generatorFactory.IsStrategySupported(strategy.Type))
            {
                error = $"Typ strategie '{strategy.Type}' není podporován.";
                return false;
            }

            var generator = _generatorFactory.GetGenerator(strategy.Type);
            return generator.ValidateStrategy(strategy, out error);
        }

        /// <summary>
        /// Získá seznam všech podporovaných typů strategií
        /// </summary>
        public IEnumerable<ExitStrategyType> GetSupportedStrategyTypes()
        {
            return _generatorFactory.GetSupportedStrategyTypes();
        }

        /// <summary>
        /// Validates a Custom Ladder strategy (sum of PercentToSell must be <= 100)
        /// Zachování pro zpětnou kompatibilitu
        /// </summary>
        [Obsolete("Use ValidateStrategy method instead")]
        public bool ValidateCustomLadderStrategy(CustomLadderExitStrategy strategy, out string? error)
        {
            return ValidateStrategy(strategy, out error);
        }

        /// <summary>
        /// Deserializuje strategii z JSON
        /// </summary>
        private ExitStrategyBase? DeserializeStrategy(string strategyJson)
        {
            try
            {
                return JsonConvert.DeserializeObject<ExitStrategyBase>(strategyJson, new JsonSerializerSettings
                {
                    TypeNameHandling = TypeNameHandling.Auto
                });
            }
            catch (JsonException)
            {
                return null;
            }
        }
    }
} 