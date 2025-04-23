using System.ComponentModel.DataAnnotations.Schema;

namespace FireFishPortfolioManager.Data
{
    [Table("v_CurrentBTCCZKPrice")]
    public class CurrentBtcCzkPrice
    {
        public decimal Price { get; set; }
    }
} 