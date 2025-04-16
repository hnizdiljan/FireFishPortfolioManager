using System;
using System.Collections.Generic;

namespace FireFishPortfolioManager.Api.Models
{
    public class User
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public decimal AllocatedBtc { get; set; } // BTC allocated for Fire Fish strategy
        public List<Loan> Loans { get; set; } = new List<Loan>();
        public string CoinmateApiKey { get; set; } // To be encrypted
        public string CoinmateApiSecret { get; set; } // To be encrypted
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; } // Timestamp of the last login
        public decimal DrawdownFromAth { get; set; } // Kolik % propadu od ATH chce uživatel krýt kolaterálem
        public decimal AbsoluteLiquidationPrice { get; set; } // Nový parametr
        public decimal LtvPercent { get; set; } // Nový parametr
    }
}
