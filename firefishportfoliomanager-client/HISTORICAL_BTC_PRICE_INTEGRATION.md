# Integrácia historických dat cen BTC/CZK

## Přehled

Vylepšení grafu metrik půjček o použití skutečných historických cen BTC/CZK místo používání aktuální ceny pro všechny historické výpočty. Tato změna poskytuje mnohem přesnější obraz vývoje hodnoty portfolia v čase.

## Nové komponenty a služby

### Backend změny

#### MarketController.cs
- **Nový endpoint**: `GET /api/market/btc-price-history`
- **Parametry**: `fromDate`, `toDate` (volitelné)
- **Funkcionalita**: Vrací historická data cen BTC/CZK z tabulky `CurrencyPairPriceHistories`
- **Default rozsah**: Posledních 2 roky, pokud nejsou specifikovány datum

```csharp
[HttpGet("btc-price-history")]
public async Task<ActionResult<List<BtcPriceHistoryDto>>> GetBtcPriceHistory(
    [FromQuery] DateTime? fromDate = null,
    [FromQuery] DateTime? toDate = null)
```

#### BtcPriceHistoryDto.cs
- **Nový DTO**: Model pro vrácení historických dat cen
- **Vlastnosti**: `Date`, `Price`, `Source`

### Frontend změny

#### marketService.ts
- **Nová služba**: Pro načítání historických dat cen BTC
- **Funkce**:
  - `fetchBtcPriceHistory()` - načítání dat z API
  - `getBtcPriceForDate()` - nalezení ceny pro konkrétní datum
  - `createPriceLookupMap()` - vytvoření efektivní mapy pro vyhledávání
  - `getPriceFromMap()` - rychlé vyhledávání ceny s fallback logikou

#### useBtcPriceHistory.ts
- **Nový hook**: Správa historických dat cen BTC
- **Funkcionalita**:
  - Načítání dat s error handling
  - Vytváření efektivní mapy pro vyhledávání
  - Poskytování funkce pro získání ceny k datu
  - Refetch možnost

#### Aktualizace useLoanMetrics.ts
- **Hlavní změna**: Použití historických cen místo aktuální ceny
- **Výpočty**: Všechny hodnoty portfolia se počítají s historickou cenou BTC pro daný den
- **Optimalizace**: Data omezena na 24 měsíců pro výkon
- **Fallback**: Použití aktuální ceny při nedostupnosti historických dat

#### Aktualizace LoanMetricsChart.tsx
- **Nové funkce**:
  - Zobrazení informace o použití historických dat
  - Error handling pro chyby načítání historických dat
  - Nový přepínač pro zobrazení BTC ceny v grafu
  - Rozšířený tooltip s historickou cenou BTC
  - Export včetně historických cen BTC

## Technické detaily

### Logika vyhledávání historické ceny
1. **Přesné hledání**: Pokud existuje cena pro přesné datum, použije se
2. **Nejbližší předchozí**: Pokud ne, použije se nejbližší starší datum
3. **Fallback**: Při nedostupnosti historických dat se použije aktuální cena

### Výpočet metrik s historickými cenami
```typescript
const totalCurrentValue = activeLoans.reduce((sum, loan) => {
  const historicalBtcValue = loan.purchasedBtc * historicalBtcPrice;
  return sum + historicalBtcValue;
}, 0);
```

### Optimalizace výkonu
- **Memoizace**: Všechny výpočty jsou cachovány
- **Efektivní mapa**: Rychlé vyhledávání cen podle datumu
- **Omezení dat**: Pouze posledních 24 měsíců
- **Batch loading**: Jednorázové načtení všech potřebných dat

## Uživatelské rozhraní

### Informační sekce
- **Info alert**: Vysvětlení používání historických dat
- **Warning alert**: Zobrazení chyb při načítání dat

### Nové funkce grafu
- **BTC cena toggle**: Možnost zobrazit vývoj ceny BTC v grafu
- **Rozšířený tooltip**: Zobrazuje historickou cenu BTC pro každý bod
- **CSV export**: Obsahuje historické ceny BTC

### Loading stavy
- **Rozdělené loading**: Samostatně pro půjčky a historická data cen
- **Informativní zprávy**: Specifické zprávy o načítání historických dat

## Výhody implementace

1. **Přesnost**: Skutečný vývoj hodnoty portfolia v čase
2. **Relevantnost**: Zisk/ztráta odpovídá skutečné historické situaci
3. **Analýza trendů**: Možnost vidět korelaci s vývojem ceny BTC
4. **Export dat**: Kompletní historická data pro další analýzu

## Error handling

### Backend
- **Validace parametrů**: Kontrola platnosti date range
- **Exception handling**: Graceful handling databázových chyb
- **Default hodnoty**: Automatické nastavení rozumných defaults

### Frontend
- **Network errors**: Zobrazení chyb načítání
- **Fallback strategie**: Použití aktuální ceny při nedostupnosti historických dat
- **User feedback**: Jasné informace o stavu načítání a chybách

## Testování

### Doporučené testy
1. **API endpoint test**: Ověření správnosti vrácených dat
2. **Date range test**: Testování různých rozsahů dat
3. **Fallback logic test**: Testování fallback na aktuální cenu
4. **Performance test**: Ověření výkonu s velkým množstvím dat
5. **UI test**: Testování zobrazení chyb a loading stavů

## Budoucí vylepšení

1. **Caching**: Redis cache pro API výsledky
2. **Komprese dat**: Optimalizace velikosti přenášených dat
3. **Streaming**: Real-time updates historických dat
4. **Predikce**: ML modely pro predikci vývoje cen
5. **Více měnových párů**: Rozšíření o další kryptomeny

## Nasazení

### Předpoklady
- Tabulka `CurrencyPairPriceHistories` obsahuje historická data
- Registrace `PortfolioDbContext` v DI kontejneru
- Funkční API endpoint pro historical data

### Konfigurace
Žádná speciální konfigurace není potřeba. Systém automaticky detekuje dostupnost historických dat a funguje s fallback na aktuální cenu.

## Kompatibilita

✅ **Zpětná kompatibilita**: Kompletně zachována
✅ **Graceful degradation**: Funguje i bez historických dat  
✅ **Existing features**: Všechny stávající funkce zůstávají beze změny 