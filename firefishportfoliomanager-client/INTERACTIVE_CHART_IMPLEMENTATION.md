# Interaktivní Drill-Down Graf - Implementace

## Přehled změn

Implementován interaktivní graf s možností drill-down z měsíčního pohledu na denní detail jednotlivých měsíců. Graf nyní zobrazuje denní snapshoty místo jen měsíčních dat a umožňuje uživateli detailní analýzu.

## Hlavní funkce

### 1. Denní snapshoty
- Graf nyní generuje denní data místo jen měsíčních intervalů
- Každý den má kompletní snapshot všech metrik půjček
- Větší množství datových bodů pro přesnější analýzu

### 2. Dual-level zobrazení
- **Měsíční přehled**: Agregovaná data po měsících
- **Denní detail**: Detailní zobrazení jednotlivých dní vybraného měsíce

### 3. Interaktivní navigace
- Kliknutím na měsíc v grafu se zobrazí denní detail
- Breadcrumb navigace pro orientaci
- Tlačítko "Zpět na měsíční přehled"

## Technické změny

### Hook `useLoanMetrics`

#### Nové typy
```typescript
export interface AggregatedDataPoint {
  period: string; // YYYY-MM for monthly, YYYY-MM-DD for daily
  displayLabel: string; // Human readable label
  // ... existing metrics
  dataPointCount: number;
  rawDataPoints: LoanMetricsDataPoint[]; // Store raw daily data
}

export type ViewLevel = 'monthly' | 'daily';
```

#### Nové parametry
```typescript
export const useLoanMetrics = (
  loans: LoanDto[], 
  currentBtcPrice: number,
  viewLevel: ViewLevel = 'monthly',
  selectedMonth?: string // YYYY-MM format for daily drill-down
): LoanMetricsAnalysis
```

#### Klíčové funkce
- `generateDailyDates()` - Generuje denní data místo měsíčních
- `aggregateDataByMonth()` - Agregace denních dat na měsíční
- `aggregateDataByDay()` - Filtrování denních dat pro vybraný měsíc

### Komponenta `LoanMetricsChart`

#### Nový state
```typescript
const [viewLevel, setViewLevel] = useState<ViewLevel>('monthly');
const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
```

#### Interaktivita
```typescript
const handleChartClick = useCallback((data: any) => {
  if (viewLevel === 'monthly' && data && data.activePayload && data.activePayload[0]) {
    const clickedData = data.activePayload[0].payload;
    if (clickedData.period) {
      setSelectedMonth(clickedData.period);
      setViewLevel('daily');
    }
  }
}, [viewLevel]);
```

#### Navigace
- Breadcrumb komponenta pro orientaci
- Tlačítko pro návrat na měsíční přehled
- Vizuální indikátory (cursor pointer, návod v tooltipu)

### Časový rozsah

Graf nyní zobrazuje pouze relevantní období:
- **Od**: Nejstarší aktivní půjčka
- **Do**: Dnešní datum
- **Fallback**: Pokud nejsou aktivní půjčky, zobrazí se od nejnovější půjčky nebo 3 měsíce zpětně

## Uživatelské rozhraní

### Měsíční přehled
- Zobrazuje agregovaná data po měsících
- Tooltip obsahuje hint "Kliknutím zobrazíte denní detail"
- Cursor se změní na pointer při hover

### Denní detail
- Zobrazuje denní data vybraného měsíce
- Breadcrumb: "Měsíční přehled > Leden 2024"
- Tlačítko "Zpět na měsíční přehled"
- Info text: "Zobrazený je denní detail vybraného měsíce"

### Export dat
- CSV export nyní rozlišuje mezi měsíčními a denními daty
- Název souboru obsahuje viewLevel: `loan-metrics-monthly-2024-01-15.csv`

## Výhody implementace

1. **Více dat**: Denní snapshoty poskytují větší granularitu
2. **Flexibilita**: Uživatel si může vybrat úroveň detailu
3. **Interaktivita**: Intuitivní drill-down funkcionalita
4. **Výkon**: Agregace dat zabraňuje přetížení grafu
5. **Navigace**: Jasná orientace pomocí breadcrumbů

## Testování

1. Spusťte aplikaci: `npm run dev`
2. Přejděte na dashboard
3. V grafu "Vývoj metrik půjček v čase":
   - Ověřte zobrazení měsíčních dat
   - Klikněte na libovolný měsíc
   - Ověřte přechod na denní detail
   - Použijte tlačítko "Zpět" nebo breadcrumb navigaci

## Další vylepšení

Možné budoucí rozšíření:
- Týdenní agregace jako prostřední úroveň
- Možnost výběru vlastního časového rozsahu
- Animace při přechodu mezi úrovněmi
- Zoom funkcionalita
- Možnost porovnání více měsíců současně 