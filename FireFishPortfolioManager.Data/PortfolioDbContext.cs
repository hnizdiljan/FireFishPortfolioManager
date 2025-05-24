using Microsoft.EntityFrameworkCore;

namespace FireFishPortfolioManager.Data
{
    public class PortfolioDbContext : DbContext
    {
        public PortfolioDbContext(DbContextOptions<PortfolioDbContext> options) : base(options) { }

        public DbSet<CurrencyPairPriceHistory> CurrencyPairPriceHistories { get; set; }
        public DbSet<CurrentBtcCzkPrice> CurrentBtcCzkPrices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<CurrencyPairPriceHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.CurrencyPair).HasMaxLength(20);
                entity.Property(e => e.Price).HasColumnType("decimal(18,8)");
                entity.Property(e => e.Source).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)");
            });

            // CurrentBtcCzkPrice is a view without primary key
            modelBuilder.Entity<CurrentBtcCzkPrice>().HasNoKey();
        }
    }
} 