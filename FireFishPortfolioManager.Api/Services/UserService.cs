using FireFishPortfolioManager.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Threading.Tasks;
using User = FireFishPortfolioManager.Data.User;

namespace FireFishPortfolioManager.Api.Services
{
    public class UserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(ApplicationDbContext context, ILogger<UserService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Gets or creates a user based on Azure AD claims
        /// </summary>
        public async Task<User> GetOrCreateUserAsync(ClaimsPrincipal claimsPrincipal)
        {
            var objectId = claimsPrincipal.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier");
            var name = claimsPrincipal.FindFirstValue("name");
            var email = claimsPrincipal.Identity?.Name;

            if (string.IsNullOrEmpty(objectId))
            {
                _logger.LogError("Failed to find the object identifier claim for the user");
                throw new System.Security.Authentication.AuthenticationException("Missing user identity");
            }

            // Try to find the user in our database
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == objectId);

            // If user doesn't exist, create a new one
            if (user == null)
            {
                user = new User
                {
                    Id = objectId,
                    Name = name ?? string.Empty,
                    Email = email ?? string.Empty,
                    // Set default values; these will be updated during onboarding
                    AllocatedBtc = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created new user: {UserId}", user.Id);
            }
            else
            {
                // Update name and email if they've changed in Azure AD
                bool updated = false;
                if (user.Name != name)
                {
                    user.Name = name ?? string.Empty;
                    updated = true;
                }
                if (user.Email != email)
                {
                    user.Email = email ?? string.Empty;
                    updated = true;
                }
                
                // Always update LastLoginAt and UpdatedAt on successful retrieval
                user.LastLoginAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                // Save changes only if necessary or LastLoginAt was updated
                if (updated || user.LastLoginAt.HasValue) // Save if name/email changed or if it's a login update
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Updated existing user details or login time: {UserId}", user.Id);
                }
                else
                {
                    _logger.LogInformation("Retrieved existing user without changes: {UserId}", user.Id);
                }
            }

            return user;
        }

        /// <summary>
        /// Updates a user's portfolio settings
        /// </summary>
        public async Task<User> UpdateUserSettingsAsync(string userId, decimal allocatedBtc, decimal drawdownFromAth, decimal absoluteLiquidationPrice, decimal ltvPercent, decimal currentBtcPriceCzk)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null)
            {
                _logger.LogError("Failed to find user with ID: {UserId}", userId);
                throw new System.InvalidOperationException("User not found");
            }

            user.AllocatedBtc = allocatedBtc;
            user.DrawdownFromAth = drawdownFromAth;
            user.AbsoluteLiquidationPrice = absoluteLiquidationPrice;
            user.LtvPercent = ltvPercent;

            // Výpočet LTV na základě drawdownFromAth a aktuální ceny BTC
            const decimal ATH_BTC_PRICE = 1800000m;
            var propad = drawdownFromAth / 100m;
            var collateralPrice = ATH_BTC_PRICE * (1 - propad);
            var targetLtv = collateralPrice > 0 ? currentBtcPriceCzk / collateralPrice : 0;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated settings for user: {UserId}", user.Id);
            
            return user;
        }

        /// <summary>
        /// Securely stores (encrypts) Coinmate API credentials for a user
        /// </summary>
        public async Task UpdateCoinmateCredentialsAsync(string userId, string apiKey, string apiSecret)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null)
            {
                _logger.LogError("Failed to find user with ID: {UserId}", userId);
                throw new System.InvalidOperationException("User not found");
            }

            // Values will be automatically encrypted by the ValueConverter when saved
            user.CoinmateApiKey = apiKey;
            user.CoinmateApiSecret = apiSecret;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated Coinmate API credentials for user: {UserId}", user.Id);
        }
    }
}
