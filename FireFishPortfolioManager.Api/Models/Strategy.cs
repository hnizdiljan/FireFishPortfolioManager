using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using JsonSubTypes;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Api.Models
{
    [JsonConverter(typeof(StringEnumConverter))]
    public enum ExitStrategyType
    {
        HODL,
        CustomLadder,
        SmartDistribution,
        EquidistantLadder,
        EquifrequentLadder
    }

    [KnownType(typeof(HodlExitStrategy))]
    [KnownType(typeof(CustomLadderExitStrategy))]
    [KnownType(typeof(SmartDistributionExitStrategy))]
    [KnownType(typeof(EquidistantLadderExitStrategy))]
    [KnownType(typeof(EquifrequentLadderExitStrategy))]
    [JsonConverter(typeof(JsonSubtypes), "Type")]
    [JsonSubtypes.KnownSubType(typeof(HodlExitStrategy), "HODL")]
    [JsonSubtypes.KnownSubType(typeof(CustomLadderExitStrategy), "CustomLadder")]
    [JsonSubtypes.KnownSubType(typeof(SmartDistributionExitStrategy), "SmartDistribution")]
    [JsonSubtypes.KnownSubType(typeof(EquidistantLadderExitStrategy), "EquidistantLadder")]
    [JsonSubtypes.KnownSubType(typeof(EquifrequentLadderExitStrategy), "EquifrequentLadder")]
    public abstract class ExitStrategyBase
    {
        public abstract ExitStrategyType Type { get; }
    }

    public class HodlExitStrategy : ExitStrategyBase
    {
        public override ExitStrategyType Type => ExitStrategyType.HODL;
        // No parameters
    }

    public class CustomLadderExitStrategy : ExitStrategyBase
    {
        public override ExitStrategyType Type => ExitStrategyType.CustomLadder;
        [Required]
        public List<CustomLadderOrder> Orders { get; set; } = new List<CustomLadderOrder>();
    }

    public class CustomLadderOrder
    {
        public decimal TargetPriceCzk { get; set; }
        public decimal PercentToSell { get; set; } // % of total purchased BTC
    }

    public class SmartDistributionExitStrategy : ExitStrategyBase
    {
        public override ExitStrategyType Type => ExitStrategyType.SmartDistribution;
        
        /// <summary>
        /// Procentuální zisk vůči "částce ke splacení" dané půjčky.
        /// Výpočet: (Potenciální hodnota strategie - částka ke splacení) / částka ke splacení * 100
        /// </summary>
        public decimal TargetProfitPercent { get; set; }
        
        /// <summary>
        /// Počet Sell orderů, které se mají vytvořit
        /// </summary>
        public int OrderCount { get; set; }
        
        /// <summary>
        /// Určuje poměr, jak velká část profitu má být uložena v BTC.
        /// 100% = veškerý profit v BTC, sell ordery pokryjí pouze "částku ke splacení"
        /// 0% = chceme utratit veškerý nakoupený BTC, veškerý profit bude v CZK
        /// 50% = 50% profitu v BTC, 50% profitu v CZK
        /// </summary>
        public decimal BtcProfitRatioPercent { get; set; }
    }

    public class EquidistantLadderExitStrategy : ExitStrategyBase
    {
        public override ExitStrategyType Type => ExitStrategyType.EquidistantLadder;
        
        /// <summary>
        /// Počáteční cena (první sell order)
        /// </summary>
        [Required]
        public decimal StartPriceCzk { get; set; }
        
        /// <summary>
        /// Konečná cena (poslední sell order)
        /// </summary>
        [Required]
        public decimal EndPriceCzk { get; set; }
        
        /// <summary>
        /// Počet sell orderů
        /// </summary>
        [Required]
        public int OrderCount { get; set; }
        
        /// <summary>
        /// Způsob distribuce BTC mezi ordery
        /// </summary>
        [Required]
        public DistributionType DistributionType { get; set; }
    }

    public class EquifrequentLadderExitStrategy : ExitStrategyBase
    {
        public override ExitStrategyType Type => ExitStrategyType.EquifrequentLadder;
        
        /// <summary>
        /// Základní cena (aktuální nebo user-defined)
        /// </summary>
        [Required]
        public decimal BasePriceCzk { get; set; }
        
        /// <summary>
        /// Procento nárůstu mezi úrovněmi (např. 10% = každá úroveň +10%)
        /// </summary>
        [Required]
        public decimal PriceIncrementPercent { get; set; }
        
        /// <summary>
        /// Počet sell orderů
        /// </summary>
        [Required]
        public int OrderCount { get; set; }
        
        /// <summary>
        /// Procento BTC na každý order
        /// </summary>
        [Required]
        public decimal BtcPercentPerOrder { get; set; }
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum DistributionType
    {
        /// <summary>
        /// Rovnoměrné rozdělení BTC mezi všechny ordery
        /// </summary>
        EQUAL,
        
        /// <summary>
        /// Klesající množství BTC s vyšší cenou
        /// </summary>
        DECREASING,
        
        /// <summary>
        /// Rostoucí množství BTC s vyšší cenou
        /// </summary>
        INCREASING
    }

    public static class ExitStrategyDescriptions
    {
        public const string HODL = "HODL: Při splatnosti se prodá potřebné množství BTC na splacení půjčky. Nejjednodušší strategie bez automatického prodeje v průběhu.";
        public const string CustomLadder = "Vlastní žebříček: Uživatel si nastaví jednotlivé prodejní úrovně (cenu a procento BTC k prodeji). Vhodné pro pokročilé uživatele.";
        public const string SmartDistribution = "Chytrá distribuce: Automaticky rozdělí prodej BTC podle cílového zisku vůči částce ke splacení a preference poměru BTC/CZK profitu. Potenciální hodnota strategie = součet sell orderů + zbývající BTC oceněné nejvyšší sell cenou.";
        public const string EquidistantLadder = "Ekvidistanční žebřík: Automaticky vytvoří žebřík s rovnoměrně rozloženými cenami mezi počáteční a konečnou cenou. Můžete zvolit způsob distribuce BTC.";
        public const string EquifrequentLadder = "Ekvifrekvenční žebřík: Žebřík s intervaly čekajícími na určité procento nárůstu. Každá úroveň je o zadané procento vyšší než předchozí.";
    }
} 