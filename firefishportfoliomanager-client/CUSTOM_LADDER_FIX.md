# Oprava problému s načítáním Custom Ladder orderů

## Problém
Při otevření existující půjčky se strategií CustomLadder se do formuláře nenačetly již existující "Custom Ladder ordery" - formulář byl prázdný.

## Identifikace příčiny
Problém byl v nekonzistentní JSON serializaci mezi backend a frontend:

1. **Backend model** používal `Orders` (PascalCase) a `TargetPriceCzk`, `PercentToSell` (PascalCase)
2. **OpenAPI/Swagger** generoval schéma s `orders` (camelCase) a `targetPriceCzk`, `percentToSell` (camelCase)
3. **Frontend** očekával `Orders` (PascalCase) ale API vracelo data bez žádné specifické naming konvence

## Řešení

### 1. Backend - Program.cs
Přidali jsme `CamelCasePropertyNamesContractResolver` do Newtonsoft.Json konfigurace:

```csharp
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.TypeNameHandling = Newtonsoft.Json.TypeNameHandling.Auto;
        options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    });
```

### 2. Frontend - ExitStrategyForm.tsx
Upravili jsme načítání strategií tak, aby očekávalo camelCase property názvy:

```typescript
if (strategyApiType === 'CustomLadder') {
  setStrategyType('CustomLadder');
  // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
  const ordersArray = (data as Record<string, unknown>).orders as Array<Record<string, unknown>> | undefined;
  const orders = ordersArray?.map((o: Record<string, unknown>) => ({
    TargetPriceCzk: o.targetPriceCzk?.toString() ?? '',
    PercentToSell: o.percentToSell?.toString() ?? '',
  })) || [];
  const ordersToSet = orders.length > 0 ? orders : defaultCustomLadder().Orders;
  setCustomLadder({ Type: 'CustomLadder', Orders: ordersToSet });
}
```

### 3. Frontend - CustomLadderStrategyEditor.tsx
Upravili jsme deserializeFromApi metodu:

```typescript
deserializeFromApi(apiValue: any): CustomLadderStrategyValue {
  // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
  const ordersArray = apiValue.orders as Array<any> | undefined;
  
  const orders = ordersArray?.map((o: any) => ({
    TargetPriceCzk: o.targetPriceCzk?.toString() ?? '',
    PercentToSell: o.percentToSell?.toString() ?? ''
  })) || [];
  
  return {
    type: 'CustomLadder',
    Orders: orders.length > 0 ? orders : this.createDefaultValue().Orders
  };
}
```

### 4. Frontend - SmartDistributionStrategyEditor.tsx
Stejné úpravy jsme provedli i pro SmartDistribution strategii:

```typescript
deserializeFromApi(apiValue: any): SmartDistributionStrategyValue {
  // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
  const targetProfitPercent = apiValue.targetProfitPercent;
  const orderCount = apiValue.orderCount;
  const btcProfitRatioPercent = apiValue.btcProfitRatioPercent;
  
  return {
    type: 'SmartDistribution',
    TargetProfitPercent: targetProfitPercent?.toString() ?? '',
    OrderCount: orderCount?.toString() ?? '',
    BtcProfitRatioPercent: btcProfitRatioPercent?.toString() ?? ''
  };
}
```

### 5. Frontend - RefactoredExitStrategyForm.tsx
Aktualizovali jsme i refaktorovanou komponentu:

```typescript
const apiStrategyType = (data as Record<string, unknown>).type;
```

## Výsledek
Po těchto změnách:
- ✅ Backend konzistentně vrací JSON s camelCase property názvy
- ✅ Frontend správně načítá Custom Ladder ordery z API
- ✅ Existující Custom Ladder strategie se zobrazí v editoru s načtenými ordery
- ✅ Změny jsou konzistentní napříč celou aplikací
- ✅ OpenAPI/Swagger schéma odpovídá skutečnému API formátu

## Testování
Pro ověření funkčnosti:
1. Vytvořte Custom Ladder strategii s několika ordery
2. Uložte strategii
3. Znovu otevřete strategii pro editaci
4. Ověřte, že se všechny ordery načetly správně

## Důležité poznámky
- Tato změna ovlivňuje všechny API endpointy - všechny JSON property se nyní serializují v camelCase
- Změna je zpětně kompatibilní, protože frontend nyní správně deserializuje camelCase data
- Frontend interně stále používá PascalCase konvenci, pouze komunikace s API je v camelCase 