# Graf metrik půjček v čase - Dokumentace

## Přehled

Graf metrik půjček v čase je nový komponent na hlavním dashboardu, který vizualizuje vývoj klíčových finančních metrik v průběhu času. Graf poskytuje ucelený pohled na výkonnost půjčkového portfolia a umožňuje analyzovat trendy a vzorce.

## Zobrazované metriky

### Hlavní metriky (vždy zobrazené)
1. **Celková částka ke splacení** - Součet všech částek, které je potřeba splatit z aktivních půjček
2. **Současná hodnota všech půjček** - Aktuální tržní hodnota všech nakoupených BTC z aktivních půjček
3. **Kumulativně půjčeno** - Celková částka půjčená v průběhu času (včetně uzavřených půjček)

### Volitelné metriky (lze zapnout/vypnout)
4. **Zisk/Ztráta** - Rozdíl mezi současnou hodnotou a částkou ke splacení
5. **Počet aktivních půjček** - Počet současně běžících půjček
6. **Hodnota kolaterálu** - Současná hodnota všech BTC sloužících jako kolaterál

## Funkce

### Interaktivní ovládání
- **Přepínače zobrazení** - Umožňují zapnout/vypnout zobrazení volitelných metrik
- **Responsive design** - Graf se přizpůsobí různým velikostem obrazovky
- **Tooltip informace** - Při najetí myší na datový bod se zobrazí detailní informace

### Analýza trendů
- **Indikátory trendů** - Automatické rozpoznání rostoucího/klesajícího/stabilního trendu
- **Procentní změny** - Zobrazení měsíčního růstu hodnoty portfolia
- **Vizuální indikátory** - Barevné rozlišení pozitivních a negativních trendů

### Export dat
- **CSV export** - Export všech dat grafu do CSV souboru
- **Souhrn** - Export současných metrik do CSV
- **Formátování** - Data jsou exportována v českém formátu s čitelnými názvy sloupců

## Technické detaily

### Komponenty
- `LoanMetricsChart.tsx` - Hlavní komponent grafu
- `useLoanMetrics.ts` - Hook pro zpracování dat a výpočet metrik

### Závislosti
- **recharts** - Knihovna pro vykreslování grafů
- **antd** - UI komponenty
- **styled-components** - Stylování

### Výpočet metrik

#### Aktivní půjčky
Půjčka je považována za aktivní, pokud:
- Datum půjčky ≤ aktuální datum
- Status = 'Active' NEBO (Status = 'Closed' A datum splacení ≥ aktuální datum)

#### Časové body
Graf vytváří datové body pro:
- Datum každé půjčky
- Datum splacení každé půjčky
- Měsíční intervaly mezi půjčkou a splacením
- Současné datum

Data jsou omezena na posledních 24 měsíců pro optimální výkon.

## Použití

### Základní integrace
```typescript
import LoanMetricsChart from './LoanMetricsChart';

<LoanMetricsChart 
  loans={loans} 
  btcPrice={btcPrice} 
  isLoading={isLoading} 
/>
```

### Hook pro zpracování dat
```typescript
import { useLoanMetrics } from '@/hooks/useLoanMetrics';

const { chartData, currentMetrics, trends } = useLoanMetrics(loans, btcPrice);
```

## Interpretace dat

### Pozitivní signály
- **Rostoucí současná hodnota** - Portfolio nabývá na hodnotě
- **Stabilní nebo rostoucí zisk** - Strategie je úspěšná
- **Rostoucí kumulativní půjčky** - Rozšiřování portfolia

### Negativní signály
- **Klesající současná hodnota** - Pokles ceny BTC ovlivňuje portfolio
- **Rostoucí ztráty** - Půjčky jsou nevýhodné při současné ceně BTC
- **Vysoký poměr ke splacení vs. současná hodnota** - Riziko likvidity

## Optimalizace výkonu

- **Memoizace** - Výpočty jsou cachovány pomocí `useMemo`
- **Omezení dat** - Zobrazují se pouze data z posledních 24 měsíců
- **Lazy loading** - Komponenty se načítají dle potřeby

## Budoucí vylepšení

1. **Predikce** - Zobrazení predikovaného vývoje na základě trendů
2. **Srovnání s benchmarky** - Porovnání s vývojem BTC nebo jiných indexů
3. **Pokročilé filtry** - Filtrování podle typu půjčky, období, atd.
4. **Alerting** - Upozornění při překročení limitů nebo významných změnách
5. **Více formátů exportu** - PDF, Excel, JSON

## Testování

Pro testování komponenty použijte mockovaná data:

```typescript
const mockLoans = [
  {
    id: 1,
    loanDate: '2024-01-01',
    repaymentDate: '2024-06-01',
    status: 'Active',
    loanAmountCzk: 100000,
    repaymentAmountCzk: 110000,
    purchasedBtc: 1.5,
    // ... další vlastnosti
  }
];

const mockBtcPrice = 2500000; // CZK
```

## Známé limitace

1. **Přesnost dat** - Graf zobrazuje aproximace na základě dostupných dat
2. **Výkon** - U velmi velkého množství půjček může být pomalejší
3. **Časové pásmo** - Všechny časy jsou interpretovány v UTC
4. **Chybějící data** - Pokud nejsou dostupná historická data, graf může být neúplný 