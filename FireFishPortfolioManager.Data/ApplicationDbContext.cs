using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using System;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly IDataProtectionProvider? _protectionProvider;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IDataProtectionProvider? protectionProvider = null)
            : base(options)
        {
            _protectionProvider = protectionProvider;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Loan> Loans { get; set; }
        public DbSet<SellOrder> SellOrders { get; set; }
        public DbSet<CurrentBtcCzkPrice> CurrentBtcCzkPrices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            // View: CurrentBtcCzkPrice (keyless)
            modelBuilder.Entity<CurrentBtcCzkPrice>().HasNoKey();
        }
    }
} 