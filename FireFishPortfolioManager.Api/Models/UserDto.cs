using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FireFishPortfolioManager.Api.Models
{
    // Data Transfer Object for User information sent to the client
    public class UserDto
    {
        [Required]
        public string Id { get; set; } // Azure AD ObjectId
        [Required]
        public string Name { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public decimal AllocatedBtc { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; } // Nullable is fine
        [Required]
        public decimal DrawdownFromAth { get; set; }
        [Required]
        public decimal LtvPercent { get; set; }
        [Required]
        public decimal AbsoluteLiquidationPrice { get; set; }

        // Optionally include a simplified list of loans if needed by the frontend immediately
        // public List<LoanSummaryDto> Loans { get; set; } 
    }
} 