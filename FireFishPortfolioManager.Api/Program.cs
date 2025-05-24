using FireFishPortfolioManager.Api.Data;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.AspNetCore.DataProtection;
using FireFishPortfolioManager.Data;
using NSwag;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Data Protection (pouze pokud šifrujete data v DB)
var keyPath = Path.Combine(builder.Environment.ContentRootPath, "dataprotection-keys");
builder.Services.AddDataProtection()
    .SetApplicationName("FireFishPortfolioManager")
    .PersistKeysToFileSystem(new DirectoryInfo(keyPath));

// Azure AD authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi()
    .AddInMemoryTokenCaches();

// DB context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add PortfolioDbContext for historical price data
builder.Services.AddDbContext<PortfolioDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<LoanService>();
builder.Services.AddScoped<PortfolioCalculationService>();
builder.Services.AddScoped<BitcoinMarketDataService>();
builder.Services.AddScoped<ExitStrategyService>();
builder.Services.AddSingleton<ISellOrderGeneratorFactory, SellOrderGeneratorFactory>();

// Refaktorované služby podle SOLID principů
builder.Services.AddScoped<ILoanCalculationService, LoanCalculationService>();
builder.Services.AddScoped<ILoanMappingService, LoanMappingService>();

builder.Services.AddHttpClient<CoinmateService>();

// Controllers, Swagger, CORS
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.TypeNameHandling = Newtonsoft.Json.TypeNameHandling.Auto;
        options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApiDocument();

var app = builder.Build();

// Exception page only in Development
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// NSwag middleware
app.UseOpenApi();
app.UseSwaggerUi();

// DB migrace při startu
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
        
        // Also migrate PortfolioDbContext
        var portfolioContext = services.GetRequiredService<PortfolioDbContext>();
        portfolioContext.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

app.Run();

