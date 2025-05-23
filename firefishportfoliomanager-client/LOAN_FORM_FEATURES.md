# Formulář pro nové půjčky - Technická dokumentace

## Přehled funkcí

### 🎯 Hlavní cíle implementace

1. **Uživatelská přívětivost**: Intuitivní a přehledný interface
2. **Responsivní design**: Funguje na všech zařízeních
3. **Automatizace**: Minimalizace manuálního zadávání
4. **Validace**: Prevence chyb a neplatných dat
5. **Vizuální feedback**: Jasné indikace stavu a postupu

## Technické detaily

### Komponenty a struktura

```typescript
// Hlavní komponenta
const LoanForm: React.FC = () => {
  // Hooks pro správu stavu
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [ltvPercent, setLtvPercent] = useState<number | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  
  // Custom hook pro logiku formuláře
  const {
    loanData,
    isLoading,
    isSaving,
    error,
    isEditing,
    updateField,
    saveLoan,
  } = useLoanForm(numericId ?? 0);
  
  // Automatické výpočty
  const loanSummary = useMemo(() => {
    // Výpočet souhrnných dat
  }, [loanData, btcPrice]);
}
```

### Kroky formuláře

#### Krok 1: Základní údaje
- **ID půjčky**: Textové pole s validací
- **Status**: Select s možnostmi Aktivní/Uzavřená
- **Datum půjčky**: DatePicker s českým formátem
- **Doba splatnosti**: Select s přednastavenými možnostmi
- **Datum splacení**: Automaticky vypočteno, read-only

#### Krok 2: Finanční detaily
- **Částka půjčky**: InputNumber s formátováním tisíců
- **Úroková sazba**: InputNumber s % symbolem
- **Částka k splacení**: Automaticky vypočteno

#### Krok 3: Bitcoin transakce
- **FireFish poplatky**: InputNumber s BTC symbolem
- **Transakční poplatky**: InputNumber s BTC symbolem
- **Kolaterál**: InputNumber s možností přepočtu
- **Celkem odesláno**: Automaticky vypočteno
- **Nakoupeno BTC**: InputNumber s BTC symbolem

#### Krok 4: Přehled
- **Finanční přehled**: Karty s barevným kódováním
- **Bitcoin přehled**: Detailní rozpis BTC transakcí
- **Základní údaje**: Shrnutí všech zadaných informací

### Automatické výpočty

```typescript
// Výpočet data splacení
const repaymentDate = new Date(loanDate);
repaymentDate.setMonth(loanDate.getMonth() + loanPeriodMonths);

// Výpočet částky k splacení
const interestFactor = 1 + ((interestRate / 100) * days / 365);
const repaymentAmount = loanAmount * interestFactor;

// Výpočet kolaterálu
const requiredCollateralCzk = repaymentAmountCzk / (ltv / 100);
const collateralBtc = requiredCollateralCzk / btcPrice;

// Výpočet celkových poplatků
const totalSent = collateral + fees + transactionFees;
const effectiveBtc = purchased - fees - transactionFees;
```

### Validace

```typescript
// Příklad validačních pravidel
const validationRules = {
  loanId: [
    { required: true, message: 'Zadejte ID půjčky' }
  ],
  loanAmountCzk: [
    { required: true, message: 'Zadejte částku půjčky' },
    { type: 'number', min: 1, message: 'Částka musí být větší než 0' }
  ],
  interestRate: [
    { required: true, message: 'Zadejte úrokovou sazbu' },
    { type: 'number', min: 0, max: 100, message: 'Úroková sazba musí být mezi 0-100%' }
  ]
};
```

### Styling a animace

```css
.loan-form-step-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.loan-form-step-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.loan-form-summary-card {
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.loan-form-summary-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
```

## API integrace

### Endpoints používané formulářem

1. **GET /api/loans/{id}** - Načtení existující půjčky
2. **POST /api/loans** - Vytvoření nové půjčky
3. **PUT /api/loans/{id}** - Aktualizace půjčky
4. **GET /api/users/current** - Načtení aktuálního uživatele (LTV)
5. **GET /api/btc/price** - Načtení aktuální ceny BTC

### Datový model

```typescript
interface LoanInput {
  userId: string;
  loanId: string;
  loanDate: string;
  loanPeriodMonths: number;
  repaymentDate: string;
  status: 'Active' | 'Closed';
  loanAmountCzk: number;
  interestRate: number;
  repaymentAmountCzk: number;
  feesBtc: number;
  transactionFeesBtc: number;
  collateralBtc: number;
  totalSentBtc: number;
  purchasedBtc: number;
}
```

## Testování

### Manuální testování

1. **Vytvoření nové půjčky**
   - Projít všemi kroky
   - Ověřit automatické výpočty
   - Otestovat validaci

2. **Editace existující půjčky**
   - Načtení dat
   - Úprava hodnot
   - Uložení změn

3. **Responsivní design**
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobil (375x667)

### Automatické testy

```typescript
// Příklad unit testu
describe('LoanForm', () => {
  it('should calculate repayment date correctly', () => {
    const loanDate = '2024-01-01';
    const loanPeriod = 6;
    const expectedDate = '2024-07-01';
    
    const result = calculateRepaymentDate(loanDate, loanPeriod);
    expect(result).toBe(expectedDate);
  });
  
  it('should validate required fields', async () => {
    render(<LoanForm />);
    
    const submitButton = screen.getByText('Vytvořit půjčku');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Zadejte ID půjčky')).toBeInTheDocument();
  });
});
```

## Výkon a optimalizace

### Optimalizace

1. **useMemo** pro výpočty
2. **useCallback** pro event handlery
3. **Lazy loading** pro velké komponenty
4. **Debouncing** pro API volání

### Metriky

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle size**: < 500KB (gzipped)

## Budoucí vylepšení

### Plánované funkce

1. **Autosave**: Automatické ukládání rozpracovaných formulářů
2. **Offline podpora**: Možnost práce bez internetového připojení
3. **Bulk import**: Hromadné nahrávání půjček z CSV/Excel
4. **Advanced validation**: Komplexnější validační pravidla
5. **Audit log**: Sledování změn a historie

### Technické vylepšení

1. **React Query**: Lepší správa server state
2. **Zod**: Runtime validace schémat
3. **React Hook Form**: Výkonnější správa formulářů
4. **Storybook**: Dokumentace komponent
5. **Cypress**: E2E testování 