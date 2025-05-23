using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

// Backend API
var apiService = builder.AddProject(
    "firefishapi",
    "../FireFishPortfolioManager.Api/FireFishPortfolioManager.Api.csproj")
    .WithHttpsEndpoint(targetPort: 7136, port: 5001, name: "apisecure");

// Frontend Vite aplikace
var frontend = builder.AddNpmApp(
    "firefishclient",
    "../firefishportfoliomanager-client",
    "dev")
    .WithHttpEndpoint(port: 3000, targetPort: 5174, name: "http")
    .WithEnvironment("VITE_API_BASE_URL", apiService.GetEndpoint("apisecure"))
    .WithEnvironment("VITE_REDIRECT_URI", "http://localhost:5174")
    ;

builder.Build().Run();