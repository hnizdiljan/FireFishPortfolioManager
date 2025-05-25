# Bitcoin Transaction Autofill Feature

## Přehled

Nová funkcionalita umožňuje uživatelům automaticky předvyplnit formulářové prvky v sekci "Bitcoin transakční detaily" při vytváření nebo editaci půjčky pomocí ID bitcoinové transakce z mempool.space API.

## Implementované funkce

### Backend (API)

1. **MempoolService** (`FireFishPortfolioManager.Api/Services/MempoolService.cs`)
   - Nový service pro komunikaci s mempool.space API
   - Načítá detaily bitcoinové transakce podle Transaction ID
   - Validuje strukturu transakce (musí mít přesně 2 výstupy)
   - Konvertuje satoshi na BTC
   - Obsahuje error handling pro různé typy chyb

2. **LoansController rozšíření**
   - Nový endpoint: `GET /api/Loans/bitcoin-transaction/{txId}`
   - Vrací `BitcoinTransactionDetails` objekt
   - Kompletní error handling s příslušnými HTTP status kódy

3. **Program.cs aktualizace**
   - Registrace `IMempoolService` a `MempoolService`
   - Přidání HttpClient pro MempoolService

### Frontend

1. **bitcoinTransactionService** (`src/services/bitcoinTransactionService.ts`)
   - TypeScript service pro volání nového API endpointu
   - Správné error handling s českými chybovými zprávami
   - Type-safe implementace s využitím generovaných API typů

2. **LoanForm rozšíření** (`src/components/Loans/LoanForm.tsx`)
   - Nová sekce "Automatické předvyplnění z Transaction ID"
   - Input pole pro zadání Transaction ID
   - Tlačítko "Načíst data" s loading stavem
   - Automatické předvyplnění polí:
     - Kolaterál (BTC)
     - FireFish poplatky (BTC)
     - Transakční poplatky (BTC)

3. **API Types aktualizace** (`src/api-types.ts`)
   - Přidán nový endpoint path
   - Přidán `BitcoinTransactionDetails` schema
   - Přidána `Loans_GetBitcoinTransactionDetails` operace

## Použití

1. **V kroku 3 (Bitcoin transakce) půjčkového wizardu:**
   - Zadejte Transaction ID do pole "Automatické předvyplnění z Transaction ID"
   - Klikněte na tlačítko "Načíst data"
   - Systém automaticky předvyplní pole Kolaterál, FireFish poplatky a Transakční poplatky

2. **Podporované formáty Transaction ID:**
   - Standardní Bitcoin transaction hash (64 hexadecimálních znaků)
   - Příklad: `ae07dab917f326357401a46424d9aaaada5f76f133f39ef1c4469bb7b3f510a0`

## Validace a Error Handling

### Backend validace:
- Transaction ID nesmí být prázdné
- Transakce musí existovat v mempool.space
- Transakce musí mít přesně 2 výstupy (vout)
- První výstup = kolaterál, druhý výstup = FireFish poplatky

### Frontend error handling:
- Neplatné ID transakce (400)
- Transakce nebyla nalezena (404)
- Chyba komunikace s externím API (502)
- Obecné chyby (500)

## Technické detaily

### API Response struktura:
```typescript
interface BitcoinTransactionDetails {
  txId: string;
  collateralBtc: number;
  fireFishFeesBtc: number;
  transactionFeesBtc: number;
  isConfirmed: boolean;
  blockHeight?: number | null;
}
```

### Mempool.space API integrace:
- URL: `https://mempool.space/api/tx/{txId}`
- Automatická konverze satoshi na BTC (dělení 100,000,000)
- Mapování: `vout[0].value` → kolaterál, `vout[1].value` → FireFish poplatky, `fee` → transakční poplatky

## Bezpečnost

- Všechny API volání vyžadují autentizaci (Bearer token)
- Validace na backend i frontend straně
- Sanitizace Transaction ID pomocí `encodeURIComponent`
- Timeout a error handling pro externí API volání

## Budoucí vylepšení

- Cache pro často používané transakce
- Podpora pro více typů transakcí
- Batch loading více transakcí najednou
- Integrace s dalšími blockchain explorery jako fallback 