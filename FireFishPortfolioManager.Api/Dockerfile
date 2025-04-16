FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["FireFishPortfolioManager.Api/FireFishPortfolioManager.Api.csproj", "FireFishPortfolioManager.Api/"]
RUN dotnet restore "FireFishPortfolioManager.Api/FireFishPortfolioManager.Api.csproj"
COPY . .
WORKDIR "/src/FireFishPortfolioManager.Api"
RUN dotnet build "FireFishPortfolioManager.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FireFishPortfolioManager.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FireFishPortfolioManager.Api.dll"]
