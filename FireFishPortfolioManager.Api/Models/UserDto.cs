using System;
using System.Collections.Generic;

namespace FireFishPortfolioManager.Api.Models
{
    // Data Transfer Object for User information sent to the client
    public class UserDto
    {
        public string Id { get; set; } // Azure AD ObjectId
        public string Name { get; set; }
        public string Email { get; set; }
        public decimal AllocatedBtc { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public decimal DrawdownFromAth { get; set; }
        public decimal LtvPercent { get; set; }
        public decimal AbsoluteLiquidationPrice { get; set; }

        // Optionally include a simplified list of loans if needed by the frontend immediately
        // public List<LoanSummaryDto> Loans { get; set; } 
    }
} 