using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System;

namespace FireFishPortfolioManager.Api.Data.Converters
{
    public class ProtectedDataConverter : ValueConverter<string, string>
    {
        // Define a purpose string for this specific protection use case
        // This ensures that data protected for one purpose cannot be unprotected for another
        private const string ProtectionPurpose = "UserSecrets";

        public ProtectedDataConverter(IDataProtectionProvider protectionProvider)
            : base(
                  // Encryption function (to database)
                  v => protectionProvider.CreateProtector(ProtectionPurpose).Protect(v),
                  // Decryption function (from database)
                  v => protectionProvider.CreateProtector(ProtectionPurpose).Unprotect(v))
        {
        }
    }
} 