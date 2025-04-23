using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Data
{
    public class User
    {
        [Required]
        public string Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Email { get; set; }
        public decimal AllocatedBtc { get; set; }
        [Required]
        public List<Loan> Loans { get; set; } = new List<Loan>();
        public string? CoinmateApiKey { get; set; }
        public string? CoinmateApiSecret { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }

        [Required]
        public decimal DrawdownFromAth { get; set; }

        [Required]
        public decimal AbsoluteLiquidationPrice { get; set; }

        [Required]
        public decimal LtvPercent { get; set; }
    }
} 