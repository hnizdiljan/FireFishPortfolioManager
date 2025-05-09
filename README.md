# Fire Fish Portfolio Manager

Aplikace pro správu půjček z platformy Fire Fish a automatizaci obchodní strategie s použitím Coinmate API.

## Popis projektu

Fire Fish Portfolio Manager je webová aplikace pro správu a optimalizaci půjček z platformy Fire Fish. Aplikace umožňuje sledovat půjčky, automaticky generovat prodejní strategie pro nakoupené BTC a integruje se s Coinmate API pro automatické zadávání prodejních příkazů.

## Technologie

### Backend
- .NET Core 9.0
- ASP.NET Core Web API
- Entity Framework Core
- Azure AD pro autentizaci
- SQL Server pro databázi

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Router

## Funkce

### Správa portfolia
- Nastavení alokace BTC pro Fire Fish strategii
- Konfigurace cílového poměru půjčky k hodnotě (LTV)
- Automatický výpočet maximální výše půjčky

### Správa půjček
- Evidence půjček z Fire Fish platformy
- Sledování stavu půjček (čekající, aktivní, splacené)
- Detailní přehled financí (částky, úroky, poplatky)
- Monitoring nakoupeného BTC

### Prodejní strategie
- Automatické generování prodejních strategií
- Nastavitelná cílová ziskovost
- Rozdělení prodeje do více příkazů
- Integrace s Coinmate API pro automatické zadávání příkazů

### Statistiky a přehledy
- Souhrnný přehled portfolia na dashboardu
- Detailní statistiky výkonnosti
- Grafy vývoje portfolia v čase
- Metriky ziskovosti

## Instalace a spuštění

### Požadavky
- .NET SDK 9.0 nebo novější
- Node.js 18.0.0 nebo novější
- SQL Server (lokální nebo vzdálený)
- Azure účet pro autentizaci (volitelné pro vývoj)

### Backend

1. Naklonujte repozitář:
```
git clone https://github.com/username/FireFishPortfolioManager.git
```

2. Přejděte do adresáře projektu:
```
cd FireFishPortfolioManager
```

3. Spusťte migraci databáze:
```
cd FireFishPortfolioManager.Api
dotnet ef database update
```

4. Upravte `appsettings.json` pro konfiguraci připojení k databázi a Azure AD:
```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "YOUR_AZURE_AD_TENANT_ID",
    "ClientId": "YOUR_AZURE_AD_CLIENT_ID",
    "CallbackPath": "/signin-oidc",
    "Scopes": "FireFish.Access"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FireFishPortfolioManager;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

5. Spusťte backend aplikace:
```
dotnet run
```

### Frontend

1. Přejděte do adresáře frontend aplikace:
```
cd firefishportfoliomanager-client
```

2. Nainstalujte závislosti:
```
npm install
```

3. Spusťte vývojový server:
```
npm start
```

4. Aplikace bude dostupná na adrese `http://localhost:3000`

## Konfigurace pro produkční nasazení

### Backend
1. Publikujte aplikaci:
```
dotnet publish -c Release
```

2. Nakonfigurujte produkční nastavení v `appsettings.Production.json`
3. Nasaďte publikované soubory na váš hostingový server

### Frontend
1. Vytvořte produkční build:
```
npm run build
```

2. Nasaďte obsah adresáře `build` na váš webový server

## Nasazení do Azure

### Příprava

1. Nainstalujte Azure CLI:
```
winget install -e --id Microsoft.AzureCLI
```

2. Přihlaste se do Azure účtu:
```
az login
```

3. Vytvořte skupinu prostředků:
```
az group create --name FireFishPortfolioResourceGroup --location westeurope
```

### Nasazení backendu (Azure App Service)

1. Vytvořte plán App Service:
```
az appservice plan create --name FireFishAppServicePlan --resource-group FireFishPortfolioResourceGroup --sku B1 --is-linux
```

2. Vytvořte SQL databázi:
```
az sql server create --name firefish-sql-server --resource-group FireFishPortfolioResourceGroup --admin-user serveradmin --admin-password "ComplexPassword123!"
az sql db create --name FireFishDB --resource-group FireFishPortfolioResourceGroup --server firefish-sql-server --service-objective S0
```

3. Nakonfigurujte pravidla firewallu pro SQL server:
```
az sql server firewall-rule create --name AllowAzureServices --server firefish-sql-server --resource-group FireFishPortfolioResourceGroup --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
```

4. Vytvořte webovou aplikaci:
```
az webapp create --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --plan FireFishAppServicePlan --runtime "DOTNET|9.0"
```

5. Nastavte connection string pro databázi:
```
az webapp config connection-string set --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --connection-string-type SQLAzure --settings DefaultConnection="Server=tcp:firefish-sql-server.database.windows.net,1433;Database=FireFishDB;User ID=serveradmin;Password=<PASSWD>;Encrypt=true;Connection Timeout=30;"
```

6. Publikujte API do Azure:
```
dotnet publish -c Release
cd FireFishPortfolioManager.Api/bin/Release/net9.0/publish
zip -r publish.zip .
az webapp deployment source config-zip --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --src publish.zip
```

7. Nakonfigurujte Azure AD:
   - V Azure portálu přejděte do Azure Active Directory
   - Vytvořte novou registraci aplikace
   - Nastavte URI přesměrování na URL vaší API aplikace s cestou pro callback, např. 
     `https://firefishportfolioapi.azurewebsites.net/signin-oidc` (hodnota musí odpovídat nastavení v appsettings.json v parametru CallbackPath)
   - V sekci "Authentication" povolte ID tokeny
   - V sekci "API permissions" přidejte oprávnění "User.Read" pro Microsoft Graph API
   - Nakopírujte ID klienta (Client ID) a ID tenanta (Tenant ID)
   - Aktualizujte nastavení aplikace:
   ```
   az webapp config appsettings set --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --settings AzureAd:TenantId="your-tenant-id" AzureAd:ClientId="your-client-id"
   ```

### Nasazení frontendu (Azure Static Web Apps)

1. Vytvořte Static Web App:
```
az staticwebapp create --name FireFishPortfolioUI --resource-group FireFishPortfolioResourceGroup --location westeurope --source https://github.com/yourusername/FireFishPortfolioManager --branch main --app-location "firefishportfoliomanager-client" --api-location "FireFishPortfolioManager.Api" --output-location "build"
```

2. Tento příkaz vytvoří GitHub Actions workflow, který automaticky nasadí aplikaci při každém push do repository.

3. Ujistěte se, že nastavíte správné proměnné prostředí pro připojení k backend API:
   - Přejděte do nastavení Static Web App v Azure Portal
   - Přidejte konfigurační parametry v sekci "Configuration" -> "Application settings"
   - Nastavte REACT_APP_API_BASE_URL na URL vašeho backend API

### Propojení frontend a backend aplikací

1. V React aplikaci upravte soubory s API voláními, aby používaly správnou URL:
   - Vytvořte `.env.production` soubor v kořenovém adresáři frontend projektu:
   ```
   REACT_APP_API_BASE_URL=https://firefishportfolioapi.azurewebsites.net/api
   ```

2. V backend API nakonfigurujte CORS pro povolení přístupu z frontendu:
```
az webapp cors add --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --allowed-origins "https://firefishportfoloui.azurestaticapps.net"
```

### Monitorování a diagnostika

1. Povolte logování aplikace:
```
az webapp log config --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --application-logging true --web-server-logging filesystem --level information
```

2. Nastavte Application Insights pro komplexní monitorování:
```
az monitor app-insights component create --app FireFishInsights --location westeurope --resource-group FireFishPortfolioResourceGroup --application-type web
az webapp config appsettings set --name FireFishPortfolioAPI --resource-group FireFishPortfolioResourceGroup --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=your-instrumentation-key"
```

## Integrace s Coinmate API

Pro správnou funkčnost automatického zadávání prodejních příkazů je potřeba nastavit Coinmate API klíče v sekci Nastavení aplikace. API klíče musí mít oprávnění pro:

- Zobrazení zůstatků na účtu
- Zadávání nákupních/prodejních příkazů
- Zobrazení stavu příkazů

## Příspěvky a vývoj

Pokud chcete přispět k vývoji aplikace, postupujte podle následujících kroků:

1. Vytvořte fork repozitáře
2. Vytvořte novou větev (`git checkout -b feature/amazing-feature`)
3. Proveďte změny a commitněte je (`git commit -m 'Add amazing feature'`)
4. Pushnete změny do své větve (`git push origin feature/amazing-feature`)
5. Otevřete Pull Request

## Licence

Tento projekt je licencován pod licencí MIT - viz soubor `LICENSE` pro více informací.

## Kontakt

- Autor: Jan Hnízdil
- GitHub: hnizdiljan
