# Oprava výpočtu úroků - Technický přehled

## Datum: 25.5.2025

## Problém
Uživatel identifikoval nepřesnost ve výpočtu "Částky k splacení (CZK)":
- Používal se jednoduchý převod měsíců na roky: `měsíce / 12`
- Skutečný počet dnů se ignoroval, což vedlo k nepřesnostem

### Příklad problému:
- Půjčka 29.4. - splatnost 29.10. (6 měsíců)
- Skutečný počet dnů: 183 dnů
- 183/365 = 0.5014 roku ≠ 6/12 = 0.5 roku
- Rozdíl může být významný při vyšších částkách

## Identifikované příčiny

### 1. Nesprávný výpočet v `LoanForm.tsx`
```typescript
// CHYBA - použití jednoduchého převodu měsíců
const interest = principal * rate * (months / 12);
const repaymentAmount = principal + interest;
```

### 2. Správný výpočet už existoval v `useLoanForm.ts`
```typescript
// SPRÁVNĚ - použití skutečného počtu dnů
const days = Math.max(1, Math.floor((utcRepaymentDate - utcLoanDate) / (1000 * 60 * 60 * 24)));
const interestFactor = 1 + ((interestRate / 100) * days / 365);
const repayment = loanAmountCzk * interestFactor;
```

### 3. Duplicitní logika výpočtu
- `LoanForm.tsx` prováděl vlastní výpočet pro UI
- `useLoanForm.ts` prováděl správný výpočet pro data layer
- Výpočty se lišily a způsobovaly nekonzistenci

## Implementované řešení

### 1. Oprava výpočtu v `LoanForm.tsx`
```typescript
// PŘED:
if (loanData.loanAmountCzk && loanData.interestRate && loanData.loanPeriodMonths) {
  const principal = loanData.loanAmountCzk;
  const rate = loanData.interestRate / 100;
  const months = loanData.loanPeriodMonths;
  
  // Jednoduchý úrok pro krátké období
  const interest = principal * rate * (months / 12);
  const repaymentAmount = principal + interest;
  // ...
}

// PO:
if (loanData.loanAmountCzk && loanData.interestRate && loanData.loanDate && loanData.repaymentDate) {
  const principal = loanData.loanAmountCzk;
  const rate = loanData.interestRate / 100;
  
  // Výpočet skutečného počtu dnů mezi datumy (stejná logika jako v useLoanForm)
  const loanDateObj = new Date(loanData.loanDate);
  const repaymentDateObj = new Date(loanData.repaymentDate);
  const utcLoanDate = Date.UTC(
    loanDateObj.getFullYear(),
    loanDateObj.getMonth(),
    loanDateObj.getDate()
  );
  const utcRepaymentDate = Date.UTC(
    repaymentDateObj.getFullYear(),
    repaymentDateObj.getMonth(),
    repaymentDateObj.getDate()
  );
  const days = Math.max(1, Math.floor((utcRepaymentDate - utcLoanDate) / (1000 * 60 * 60 * 24)));
  
  // Výpočet úroku na základě skutečného počtu dnů
  const interestFactor = 1 + (rate * days / 365);
  const repaymentAmount = principal * interestFactor;
  // ...
}
```

### 2. Aktualizace závislostí useEffect
```typescript
// PŘED:
}, [loanData.loanAmountCzk, loanData.interestRate, loanData.loanPeriodMonths, updateField, form]);

// PO:
}, [loanData.loanAmountCzk, loanData.interestRate, loanData.loanDate, loanData.repaymentDate, updateField, form]);
```

### 3. Lepší Tooltip vysvětlení
```typescript
// PŘED:
<Tooltip title="Automaticky vypočteno: částka půjčky + úroky">

// PO:
<Tooltip title="Automaticky vypočteno na základě skutečného počtu dnů mezi datem půjčky a splatností: částka × (1 + sazba × dny/365)">
```

## Vzorec výpočtu

### Nový přesný vzorec:
```
Částka k splacení = Hlavní částka × (1 + (Úroková sazba × Počet dnů / 365))
```

### Kde:
- **Hlavní částka**: Půjčená částka v CZK
- **Úroková sazba**: Roční úroková sazba (v desetinném tvaru, např. 0.07 pro 7%)
- **Počet dnů**: Skutečný počet dnů mezi datem půjčky a datem splatnosti
- **365**: Počet dnů v roce pro finanční výpočty

### Příklady:
```
Půjčka: 100 000 CZK, 7% p.a.
29.4. - 29.10. = 183 dnů

Starý výpočet:
100 000 × (1 + 0.07 × 6/12) = 100 000 × 1.035 = 103 500 CZK

Nový výpočet:
100 000 × (1 + 0.07 × 183/365) = 100 000 × 1.03507 = 103 507 CZK

Rozdíl: 7 CZK (přesnější o 7 CZK)
```

## Výhody nového řešení

### 1. **Přesnost**
- Používá skutečný počet dnů místo aproximace
- Zohledňuje přestupné roky a různé délky měsíců
- Finančně správný výpočet

### 2. **Konzistence**
- Stejná logika v `LoanForm.tsx` i `useLoanForm.ts`
- Eliminuje duplicitní kód s různými výsledky
- Konzistentní výpočty napříč aplikací

### 3. **Transparentnost**
- Lepší tooltip vysvětluje přesný vzorec
- Uživatel vidí, jak se výpočet provádí
- Možnost ověření výpočtu

### 4. **Robustnost**
- UTC datum eliminuje problémy s časovými zónami
- `Math.max(1, ...)` zabraňuje nulovým/záporným dnům
- Správné zaokrouhlování na celé koruny

## Testování

### Testovací scénáře:
1. **Standardní půjčka**: 6 měsíců, celé měsíce
2. **Krátká půjčka**: 1 měsíc, 30-31 dnů
3. **Dlouhá půjčka**: 12 měsíců, 365 dnů
4. **Přestupný rok**: Půjčka přes 29. února
5. **Různé měsíce**: 28, 30, 31 dnů

### Výsledky:
- ✅ Build prochází bez chyb
- ✅ TypeScript kontrola prošla
- ✅ Konzistentní výpočty mezi UI a data layer
- ✅ Přesnější výpočty úroků
- ✅ Lepší uživatelská dokumentace

## Soubory změněny
- `src/components/Loans/LoanForm.tsx` - oprava výpočtu úroků a tooltip
- `INTEREST_CALCULATION_FIX.md` - nová dokumentace

## Standard pro budoucnost

### Vždy používat:
```typescript
// Výpočet skutečného počtu dnů
const days = Math.max(1, Math.floor((utcRepaymentDate - utcLoanDate) / (1000 * 60 * 60 * 24)));

// Výpočet úroku na základě dnů
const interestFactor = 1 + (rate * days / 365);

// Zaokrouhlení na celé koruny
const repaymentAmount = Math.round(principal * interestFactor);
```

### Nikdy nepoužívat:
```typescript
// ŠPATNĚ - nepřesná aproximace
const yearFraction = months / 12;
const interest = principal * rate * yearFraction;
```

## Poznámky
- Změna se týká pouze UI výpočtu v `LoanForm.tsx`
- Backend API a `useLoanForm.ts` už používaly správnou logiku
- Zachována je zpětná kompatibilita se všemi existujícími půjčkami
- Nové půjčky budou mít přesnější výpočty úroků 