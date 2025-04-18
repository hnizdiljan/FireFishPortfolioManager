using FireFishPortfolioManager.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using Microsoft.AspNetCore.DataProtection;
using FireFishPortfolioManager.Api.Data.Converters;

namespace FireFishPortfolioManager.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly IDataProtectionProvider? _protectionProvider;

        // Constructor used by dependency injection
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IDataProtectionProvider? protectionProvider = null)
            : base(options)
        {
            _protectionProvider = protectionProvider;
        }

        // Configuration for design-time tools
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                IConfigurationRoot configuration = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                    .Build();
                var connectionString = configuration.GetConnectionString("DefaultConnection");
                optionsBuilder.UseSqlServer(connectionString);
            }
            base.OnConfiguring(optionsBuilder);
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Loan> Loans { get; set; }
        public DbSet<SellOrder> SellOrders { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);

            modelBuilder.Entity<User>()
                .Property(u => u.AllocatedBtc)
                .HasPrecision(18, 8);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Loans)
                .WithOne(l => l.User)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Apply data protection converter only if provider is available (runtime)
            if (_protectionProvider != null)
            {
                var converter = new ProtectedDataConverter(_protectionProvider);

                modelBuilder.Entity<User>()
                    .Property(u => u.CoinmateApiKey)
                    .HasConversion(converter)
                    .IsRequired(false);
                
                modelBuilder.Entity<User>()
                    .Property(u => u.CoinmateApiSecret)
                    .HasConversion(converter)
                    .IsRequired(false);
            }
            else
            {
                modelBuilder.Entity<User>()
                    .Property(u => u.CoinmateApiKey)
                    .IsRequired(false); 
                modelBuilder.Entity<User>()
                    .Property(u => u.CoinmateApiSecret)
                    .IsRequired(false);
            }

            // Loan configuration
            modelBuilder.Entity<Loan>()
                .HasKey(l => l.Id);

            modelBuilder.Entity<Loan>()
                .Property(l => l.CollateralBtc)
                .HasColumnType("decimal(18,8)");
            modelBuilder.Entity<Loan>()
                .Property(l => l.FeesBtc)
                .HasColumnType("decimal(18,8)");
            modelBuilder.Entity<Loan>()
                .Property(l => l.TransactionFeesBtc)
                .HasColumnType("decimal(18,8)");
            modelBuilder.Entity<Loan>()
                .Property(l => l.TotalSentBtc)
                .HasColumnType("decimal(18,8)");
            modelBuilder.Entity<Loan>()
                .Property(l => l.PurchasedBtc)
                .HasColumnType("decimal(18,8)");

            modelBuilder.Entity<Loan>()
                .HasMany(l => l.SellOrders)
                .WithOne(s => s.Loan)
                .HasForeignKey(s => s.LoanId)
                .OnDelete(DeleteBehavior.Cascade);

            // SellOrder configuration
            modelBuilder.Entity<SellOrder>()
                .HasKey(s => s.Id);
        }
    }
}
