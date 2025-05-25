# Opravy na základě zpětné vazby uživatelů

## Datum: 24.5.2025

### Zpětná vazba od uživatelů:
1. **Ikona tlačítka "Zrušit"**: "Ve formuláři editace a vytváření nové půjčky u 'zrušit' mi přijde divná ta šipka... chtělo by to nějakou jinou ikonku"
2. **Číselná pole**: "Pak u číselných polí nejde políčko komplet smazat, vyplní se tam nula. U čísel, který nekončí na nulu, tak to není moc praktický"
3. **Zaokrouhlování CZK**: "Ve formuláři editace/vytváření nových loans se v atributu 'Částka k splacení (CZK)' se má správně zaokrouhlovat na celé jednotky korun, žádná desetinná čísla. Zaokrouhluje se na stovky a občas je vidět až na 8 desetinných míst. Při editaci se zobrazují desetinná čísla a při vytváření se zaokrouhluje na stovky."
4. **Dodatečná zpětná vazba**: "Při vytváření nové půjčky se zdá, že je tam zaokrouhlení na stovky nebo tisíce... správně má být zaokrouhleno na jednotky."

## Implementované opravy:

### 1. Změna ikony tlačítka "Zrušit"
- **Problém**: Tlačítko "Zrušit" používalo `ArrowLeftOutlined` ikonu, která byla matoucí
- **Řešení**: Změněno na `CloseOutlined` ikonu, která lépe reprezentuje akci zrušení
- **Soubory**:
  - `src/components/Loans/LoanForm/LoanFormNavigation.tsx`
  - `src/components/Loans/LoanForm.tsx` (starý formulář)

### 2. Vylepšení číselných polí
- **Problém**: Standardní `InputNumber` komponenta automaticky nastavovala hodnotu na 0 při vymazání pole
- **Řešení**: Vytvořena nová komponenta `CustomInputNumber` s následujícími vlastnostmi:
  - Umožňuje úplné vymazání hodnoty
  - Podporuje `allowEmpty` prop pro kontrolu, zda může být pole prázdné
  - Prázdná hodnota se předává jako `null` místo `0`
  - Zachovává všechny ostatní vlastnosti standardního `InputNumber`

### 3. Oprava zaokrouhlování CZK hodnot
- **Problém**: 
  - Pole "Částka k splacení (CZK)" zobrazovalo až 8 desetinných míst
  - Nekonzistentní zaokrouhlování na stovky/tisíce místo na koruny
  - Nekonzistentní chování mezi vytvářením a editací

- **Identifikované příčiny**:
  1. **useLoanForm hook** - automatické výpočty neokrouhloval na celé koruny
  2. **useLoanForm hook** - načítání z API neokrouhloval hodnoty
  3. **LoanForm.tsx** - synchronizace formuláře přepisovala hodnoty bez zaokrouhlení
  4. **saveLoan** - při ukládání se neokrouhlovaly CZK hodnoty
  5. **⚠️ HLAVNÍ PROBLÉM**: `step={1000}` v poli "Půjčená částka (CZK)" způsobovalo zaokrouhlování vstupů na tisíce

- **Řešení**:
  - **Přidáno `Math.round()`** do všech automatických výpočtů
  - **Přidáno zaokrouhlování** při načítání dat z API
  - **Přidáno zaokrouhlování** při synchronizaci formuláře
  - **Přidáno zaokrouhlování CZK** při ukládání do databáze
  - **🔥 ODSTRANĚNO `step={1000}`** z pole "Půjčená částka (CZK)"

### 4. Oprava výpočtu úroků na základě skutečných dnů
- **Problém**: Výpočet "Částky k splacení (CZK)" používal nepřesný převod měsíců na roky (`měsíce / 12`)
- **Řešení**: 
  - **Používá skutečný počet dnů** mezi datem půjčky a splatností
  - **Přesnější vzorec**: `částka × (1 + sazba × dny/365)`
  - **Konzistence** s výpočtem v `useLoanForm.ts`
  - **Lepší tooltip** vysvětlující přesný vzorec

- **Příklad zlepšení**:
  ```
  Půjčka: 100 000 CZK, 7% p.a., 29.4. - 29.10. (183 dnů)
  
  Starý výpočet: 100 000 × (1 + 0.07 × 6/12) = 103 500 CZK
  Nový výpočet:  100 000 × (1 + 0.07 × 183/365) = 103 507 CZK
  
  Zlepšení: Přesnější o 7 CZK
  ```

### 5. Nová komponenta CustomInputNumber
**Umístění**: `src/components/Common/CustomInputNumber.tsx`

**Vlastnosti**:
- `allowEmpty?: boolean` - určuje, zda může být pole prázdné (výchozí: `true`)
- `onChange?: (value: number | null) => void` - callback s podporou `null` hodnoty
- Všechny ostatní props z `InputNumberProps`

**Logika**:
- Pokud je `allowEmpty=true` a pole je prázdné, vrací `null`
- Pokud je `allowEmpty=false` a pole je prázdné při opuštění (onBlur), nastaví `0`
- Zachovává interní stav pro lepší UX

### 6. Aktualizace formulářů
**Refaktorované komponenty**:
- `BasicInfoStep.tsx` - doba splatnosti (`allowEmpty=false`)
- `FinancialDetailsStep.tsx` - všechna CZK pole s `precision={0}`
- `BitcoinTransactionStep.tsx` - všechna BTC pole (`allowEmpty=true`, `precision={8}`)
- `LoanForm.tsx` - starý formulář (všechna pole)

**Konfigurace polí**:
- **CZK pole**: `precision={0}`, **BEZ `step={1000}`**, formátování s oddělovačem tisíců
- **BTC pole**: `precision={8}`, `allowEmpty=true`
- **Procenta**: `precision={2}`, `allowEmpty=false`
- **Automatické hodnoty**: `disabled=true`

### 7. Vyčištění nepoužívaných komponent
- **❌ SMAZÁNA**: Celá složka `src/components/Loans/LoanForm/` (refaktorovaný formulář)
  - Komponenty: `LoanForm.tsx`, `BasicInfoStep.tsx`, `FinancialDetailsStep.tsx`, `BitcoinTransactionStep.tsx`, `SummaryStep.tsx`, `LoanFormHeader.tsx`, `LoanFormNavigation.tsx`
  - Utility: `utils.ts`, `types.ts`, `index.ts`
- **✅ ZACHOVÁN**: `src/components/Loans/LoanForm.tsx` (aktivně používaný v routingu)

### 8. Export komponenty
- Přidán export v `src/components/Common/index.ts`
- Komponenta je použitelná v celé aplikaci

## Testování
- ✅ Build prochází bez chyb (`npm run build`)
- ✅ TypeScript kontrola prošla
- ✅ Všechny importy jsou správné
- ✅ Komponenty jsou správně exportované
- ✅ CZK hodnoty se zobrazují pouze v celých korunách
- ✅ **Uživatel může zadat libovolnou přesnou hodnotu** (např. 50123 CZK)
- ✅ Automatické výpočty používají `Math.round()` pro celé koruny
- ✅ Repository vyčištěno od duplicitních/nepoužívaných komponent

## Výsledek
- ✅ Uživatelé nyní mohou úplně vymazat číselná pole bez automatického nastavení na 0
- ✅ Tlačítko "Zrušit" má intuitivnější ikonu (křížek místo šipky)
- ✅ **CZK hodnoty se zobrazují pouze v celých korunách** (bez desetinných míst)
- ✅ **ŽÁDNÉ vynucené zaokrouhlování při zadávání** - uživatel může zadat přesnou hodnoty
- ✅ **Odstraněno zaokrouhlování na tisíce** - hodnoty jsou přesné na koruny
- ✅ **Konzistentní chování** mezi vytvářením a editací půjček
- ✅ **Správné formátování** s oddělovačem tisíců pro lepší čitelnost
- ✅ **Přesnější výpočet úroků** na základě skutečného počtu dnů
- ✅ **Konzistentní výpočty** napříč celou aplikací (UI i data layer)
- ✅ **Transparentní výpočty** s lepším vysvětlením ve tooltip
- ✅ Zachována je zpětná kompatibilita se všemi existujícími funkcemi
- ✅ Vylepšena je uživatelská zkušenost při práci s formuláři
- ✅ **Repository je vyčištěno** od nepoužívaných komponent

## Soubory změněny
- `src/hooks/useLoanForm.ts` - zaokrouhlování v automatických výpočtech, načítání a ukládání
- `src/components/Loans/LoanForm.tsx` - oprava výpočtu úroků, odstranění `step={1000}`, zaokrouhlování při synchronizaci
- `src/components/Common/CustomInputNumber.tsx` - nová komponenta (vytvoření)
- `src/components/Common/index.ts` - export nové komponenty

## Soubory smazané
- ❌ `src/components/Loans/LoanForm/` - celá složka s nepoužívanými komponenty

## Nová dokumentace
- `INTEREST_CALCULATION_FIX.md` - technický přehled opravy výpočtu úroků
- `CZK_ROUNDING_FIX.md` - technický přehled opravy zaokrouhlování
- `USER_FEEDBACK_FIXES.md` - tento souhrnný dokument

## Poznámky pro budoucí vývoj
- `CustomInputNumber` komponenta může být použita i v jiných částech aplikace
- Komponenta je plně kompatibilní s Ant Design designem
- **NIKDY nepoužívat `step={1000}` nebo podobné pro CZK pole** - omezuje uživatele
- **Při všech CZK polích používat `precision={0}`** pro konzistenci
- **Při všech BTC polích používat `precision={8}`** pro Bitcoin standard
- **Vždy zaokrouhlovat CZK hodnoty** při výpočtech, načítání a ukládání pomocí `Math.round()` 