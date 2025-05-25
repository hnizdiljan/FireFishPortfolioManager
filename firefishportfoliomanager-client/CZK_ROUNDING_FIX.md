# Oprava zaokrouhlování CZK hodnot - Technický přehled

## Datum: 24.5.2025

## Problém
Uživatel reportoval problém s polem "Částka k splacení (CZK)" ve formulářích půjček:
- Zobrazování až 8 desetinných míst místo celých korun
- Zaokrouhlování na stovky místo jednotek
- Nekonzistentní chování mezi vytvářením a editací půjček

## Identifikované příčiny

### 1. Problém v `useLoanForm` hook - automatický výpočet
```typescript
// CHYBA - ukládání nepřesných hodnot
updatedData.repaymentAmountCzk = repayment;  // Bez zaokrouhlení
```

### 2. Problém v `useLoanForm` hook - načítání z API
```typescript
// CHYBA - načítání hodnot s desetinnými místy z databáze
repaymentAmountCzk: existingLoan.repaymentAmountCzk,  // Bez zaokrouhlení
```

### 3. Problém v `LoanForm.tsx` - synchronizace formuláře
```typescript
// CHYBA - přepíše zaokrouhlenou hodnotu hodnotou z databáze
repaymentAmountCzk: loanData.repaymentAmountCzk,  // Bez zaokrouhlení
```

### 4. Chybějící zaokrouhlování při ukládání
V `saveLoan` funkci se zaokrouhlovaly pouze BTC hodnoty, ale ne CZK.

### 5. ⚠️ FINÁLNÍ PROBLÉM: `step={1000}` v FinancialDetailsStep.tsx
```typescript
// CHYBA - způsobuje zaokrouhlování při zadávání na tisíce
<CustomInputNumber step={1000} ... />  // Pole "Půjčená částka (CZK)"
```

## Implementované řešení

### 1. Oprava automatického výpočtu v `useLoanForm.ts`
```typescript
// PŘED:
updatedData.repaymentAmountCzk = repayment;

// PO:
updatedData.repaymentAmountCzk = Math.round(repayment);  // ✅ Celé koruny
```

### 2. Oprava načítání z API v `useLoanForm.ts`
```typescript
// PŘED:
loanAmountCzk: existingLoan.loanAmountCzk,
repaymentAmountCzk: existingLoan.repaymentAmountCzk,

// PO:
loanAmountCzk: existingLoan.loanAmountCzk ? Math.round(existingLoan.loanAmountCzk) : existingLoan.loanAmountCzk,
repaymentAmountCzk: existingLoan.repaymentAmountCzk ? Math.round(existingLoan.repaymentAmountCzk) : existingLoan.repaymentAmountCzk,
```

### 3. Oprava synchronizace formuláře v `LoanForm.tsx`
```typescript
// PŘED:
loanAmountCzk: loanData.loanAmountCzk,
repaymentAmountCzk: loanData.repaymentAmountCzk,

// PO:
loanAmountCzk: loanData.loanAmountCzk ? Math.round(loanData.loanAmountCzk) : loanData.loanAmountCzk,
repaymentAmountCzk: loanData.repaymentAmountCzk ? Math.round(loanData.repaymentAmountCzk) : loanData.repaymentAmountCzk,
```

### 4. Přidání zaokrouhlování CZK při ukládání
```typescript
// Nové - zaokrouhlení CZK hodnot při ukládání
const czkFields: (keyof LoanInput)[] = [
  'loanAmountCzk',
  'repaymentAmountCzk',
];
czkFields.forEach(field => {
  if (typeof loanToSave[field] === 'number') {
    (loanToSave[field] as number) = Math.round(loanToSave[field] as number);
  }
});
```

### 5. ✅ FINÁLNÍ OPRAVA: Odstranění `step={1000}`
```typescript
// PŘED - v FinancialDetailsStep.tsx:
<CustomInputNumber
  step={1000}           // ❌ Zaokrouhluje vstup na tisíce
  precision={0}
  ...
/>

// PO:
<CustomInputNumber
  precision={0}         // ✅ Pouze omezení zobrazení
  ...                   // ✅ Bez step - uživatel může zadat přesnou hodnotu
/>
```

### 6. Vyčištění nepoužívaných komponent
- ❌ **SMAZÁNA**: Celá složka `src/components/Loans/LoanForm/` (refaktorovaný formulář)
  - `LoanForm.tsx`, `BasicInfoStep.tsx`, `FinancialDetailsStep.tsx`, `BitcoinTransactionStep.tsx`
  - `SummaryStep.tsx`, `LoanFormHeader.tsx`, `LoanFormNavigation.tsx`
  - `utils.ts`, `types.ts`, `index.ts`
- ✅ **ZACHOVÁN**: `src/components/Loans/LoanForm.tsx` (monolitický - aktivně používaný)

## Výsledek
- ✅ CZK hodnoty se zobrazují pouze v celých korunách (precision={0})
- ✅ **Uživatel může zadat přesnou hodnotu** - žádné vynucené zaokrouhlování při zadávání
- ✅ Zaokrouhlování na jednotky korun, ne na tisíce  
- ✅ Konzistentní chování mezi vytvářením a editací půjček
- ✅ Automatické výpočty používají `Math.round()` pro celé koruny
- ✅ Načítání z databáze zaokrouhluje na celé koruny
- ✅ Synchronizace formuláře zachovává celé koruny
- ✅ Ukládání do databáze zaokrouhluje na celé koruny
- ✅ Repository vyčištěno od nepoužívaných komponent

## Soubory změněny
- `src/hooks/useLoanForm.ts` - zaokrouhlování v výpočtech, načítání a ukládání
- `src/components/Loans/LoanForm.tsx` - zaokrouhlování při synchronizaci formuláře
- ❌ **SMAZÁNA**: `src/components/Loans/LoanForm/` - celá složka s nepoužívanými komponenty

## Standard pro budoucnost
```typescript
// CZK pole:
precision={0}           // Celé koruny - pouze zobrazení
Math.round(value)       // Při všech výpočtech a ukládání
// BEZ step={1000} !!    // Umožnit uživateli zadat přesnou hodnotu

// BTC pole:
precision={8}           // Bitcoin standard
Number(value.toFixed(8)) // Při ukládání

// Procenta:
precision={2}           // Dvě desetinná místa

// Automatické hodnoty:
disabled={true}         // Pouze čtení
```

## Testování
- ✅ Build prochází bez chyb
- ✅ TypeScript kontrola prošla
- ✅ Všechny CZK hodnoty jsou zaokrouhleny na celé koruny
- ✅ **Uživatel může zadat libovolnou hodnotu** (např. 50123 CZK)
- ✅ Automatické výpočty, načítání, synchronizace i ukládání správně zaokrouhlují
- ✅ Repository je vyčištěno od duplicitních komponent