using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using FireFishPortfolioManager.Data;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices((context, services) =>
    {
        var connectionString =
            context.Configuration["SqlConnectionString"] ??
            context.Configuration["ConnectionStrings:DefaultConnection"];
        services.AddDbContext<PortfolioDbContext>(options =>
            options.UseSqlServer(connectionString));
        services.AddHttpClient();
        services.AddScoped<ICurrencyPriceHistoryService, CurrencyPriceHistoryService>();
    })
    .Build();

host.Run();

// Service interface and implementation
public interface ICurrencyPriceHistoryService
{
    Task UpsertPriceAsync(string pair, decimal price, string source, DateTime date);
}

public class CurrencyPriceHistoryService : ICurrencyPriceHistoryService
{
    private readonly PortfolioDbContext _db;
    public CurrencyPriceHistoryService(PortfolioDbContext db) => _db = db;

    public async Task UpsertPriceAsync(string pair, decimal price, string source, DateTime date)
    {
        var existing = await _db.CurrencyPairPriceHistories
            .FirstOrDefaultAsync(x => x.CurrencyPair == pair && x.Date == date);

        if (existing != null)
        {
            existing.Price = price;
            existing.Source = source;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.CurrencyPairPriceHistories.Add(new CurrencyPairPriceHistory
            {
                CurrencyPair = pair,
                Price = price,
                Source = source,
                Date = date,
                CreatedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
    }
} 