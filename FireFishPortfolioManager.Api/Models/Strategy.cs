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
        SmartDistribution
    }

    [KnownType(typeof(HodlExitStrategy))]
    [KnownType(typeof(CustomLadderExitStrategy))]
    [KnownType(typeof(SmartDistributionExitStrategy))]
    [JsonConverter(typeof(JsonSubtypes), "Type")]
    [JsonSubtypes.KnownSubType(typeof(HodlExitStrategy), "HODL")]
    [JsonSubtypes.KnownSubType(typeof(CustomLadderExitStrategy), "CustomLadder")]
    [JsonSubtypes.KnownSubType(typeof(SmartDistributionExitStrategy), "SmartDistribution")]
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
        public decimal TargetProfitPercent { get; set; }
        public int OrderCount { get; set; }
        public decimal BtcProfitRatioPercent { get; set; } // % of profit to keep in BTC
    }

    public class SellStrategy
    {
        public int LoanId { get; set; }
        public decimal CurrentBtcPriceCzk { get; set; }
        public decimal TargetSellPriceCzk { get; set; }
        public decimal BtcToSellForRepayment { get; set; }
        public decimal RemainingBtcProfit { get; set; }
        public bool IsViable { get; set; }
        [Required]
        public List<SellStrategyOrder> SellOrders { get; set; } = new List<SellStrategyOrder>();
        public bool HasStrategySet { get; set; } // true pokud je nastavena strategie
    }
    
    // Renamed from PlannedSellOrder
    public class SellStrategyOrder
    {
        public decimal BtcAmount { get; set; }
        public decimal PricePerBtc { get; set; }
        public decimal TotalCzk { get; set; }
    }

    public static class ExitStrategyDescriptions
    {
        public const string HODL = "HODL: Při splatnosti se prodá potřebné množství BTC na splacení půjčky. Nejjednodušší strategie bez automatického prodeje v průběhu.";
        public const string CustomLadder = "Vlastní žebříček: Uživatel si nastaví jednotlivé prodejní úrovně (cenu a procento BTC k prodeji). Vhodné pro pokročilé uživatele.";
        public const string SmartDistribution = "Chytrá distribuce: Automaticky rozdělí prodej BTC do více úrovní podle cílového zisku a preferencí. Vhodné pro optimalizaci výnosu.";
    }
} 