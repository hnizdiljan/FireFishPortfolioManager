using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

var builder = DistributedApplication.CreateBuilder(args);

// Backend API
var api = builder.AddProject(
    "api",
    "../FireFishPortfolioManager.Api/FireFishPortfolioManager.Api.csproj")
    .WithEndpoint(port: 5000, scheme: "https", name: "api-http");

// React Client (npm start)
var client = builder.AddExecutable(
    "client",
    "npm",
    args: "start",
    workingDirectory: "../firefishportfoliomanager-client")
    .WithEnvironment("REACT_APP_API_BASE_URL", () => api.GetEndpoint("api-http")!.Url);

builder.Build().Run();
