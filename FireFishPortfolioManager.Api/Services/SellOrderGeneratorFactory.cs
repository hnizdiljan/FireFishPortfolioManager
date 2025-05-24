using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services.Strategies;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Factory implementace pro vytváření sell order generátorů.
    /// Automaticky registruje všechny dostupné generátory a poskytuje je podle typu strategie.
    /// </summary>
    public class SellOrderGeneratorFactory : ISellOrderGeneratorFactory
    {
        private readonly Dictionary<ExitStrategyType, ISellOrderGenerator> _generators;

        public SellOrderGeneratorFactory()
        {
            // Automatická registrace všech generátorů
            _generators = new Dictionary<ExitStrategyType, ISellOrderGenerator>();
            RegisterGenerators();
        }

        public ISellOrderGenerator GetGenerator(ExitStrategyType strategyType)
        {
            if (!_generators.TryGetValue(strategyType, out var generator))
            {
                throw new NotSupportedException($"Strategy type '{strategyType}' is not supported. " +
                    $"Supported types: {string.Join(", ", GetSupportedStrategyTypes())}");
            }
            
            return generator;
        }

        public IEnumerable<ExitStrategyType> GetSupportedStrategyTypes()
        {
            return _generators.Keys;
        }

        public bool IsStrategySupported(ExitStrategyType strategyType)
        {
            return _generators.ContainsKey(strategyType);
        }

        /// <summary>
        /// Registruje všechny dostupné generátory.
        /// Pro přidání nové strategie stačí vytvořit nový generátor a přidat ho zde.
        /// </summary>
        private void RegisterGenerators()
        {
            var generators = new ISellOrderGenerator[]
            {
                new HodlSellOrderGenerator(),
                new CustomLadderSellOrderGenerator(),
                new SmartDistributionSellOrderGenerator(),
                new EquidistantLadderSellOrderGenerator(),
                new EquifrequentLadderSellOrderGenerator()
            };

            foreach (var generator in generators)
            {
                _generators[generator.SupportedStrategyType] = generator;
            }
        }
    }
} 