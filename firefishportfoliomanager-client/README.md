# FireFish Portfolio Manager Client

Frontendová aplikace pro správu portfolia FireFish, postavená pomocí Reactu a TypeScriptu.

Tento projekt byl původně vytvořen pomocí [Create React App](https://github.com/facebook/create-react-app).

## Předpoklady

Před spuštěním projektu se ujistěte, že máte nainstalováno:
*   [Node.js](https://nodejs.org/) (verze 18.x nebo vyšší doporučena)
*   [npm](https://www.npmjs.com/) (obvykle se instaluje s Node.js)

## Dostupné skripty

V kořenovém adresáři projektu můžete spustit následující příkazy:

### `npm install`

Nainstaluje všechny potřebné závislosti projektu. Tento příkaz by měl být spuštěn jako první po klonování repozitáře.

### `npm start`

Spustí aplikaci ve vývojovém režimu.\\
Otevřete [http://localhost:3000](http://localhost:3000) pro zobrazení v prohlížeči.

Stránka se automaticky znovu načte při každé úpravě zdrojových souborů.\\
Případné chyby lintování se zobrazí v konzoli.

### `npm test`

Spustí testy v interaktivním režimu sledování.\\
Více informací o spouštění testů naleznete v [dokumentaci Create React App](https://facebook.github.io/create-react-app/docs/running-tests).

### `npm run build`

Sestaví aplikaci pro produkční nasazení do adresáře `build`.\\
Kód je optimalizován pro nejlepší výkon, minifikován a názvy souborů obsahují hashe.

Aplikace je připravena k nasazení.
Více informací o nasazení naleznete v [dokumentaci Create React App](https://facebook.github.io/create-react-app/docs/deployment).

### `npm run generate:api`

Vygeneruje TypeScript typy z OpenAPI (Swagger) specifikace backend API.\\
Spusťte tento skript, pokud došlo ke změnám v API kontraktu backendu. Definuje se v `src/api-types.ts`.

### `npm run eject`

**Poznámka: Toto je jednosměrná operace. Jakmile provedete `eject`, nemůžete se vrátit zpět!**

Pokud nejste spokojeni s nástroji pro sestavení a konfigurací, můžete kdykoli provést `eject`. Tento příkaz odstraní jedinou závislost na sestavení z vašeho projektu.

Místo toho zkopíruje všechny konfigurační soubory a přechodné závislosti (webpack, Babel, ESLint atd.) přímo do vašeho projektu, takže nad nimi budete mít plnou kontrolu. Všechny příkazy kromě `eject` budou stále fungovat, ale budou odkazovat na zkopírované skripty, takže je můžete upravovat. Od tohoto okamžiku jste na to sami.

Nemusíte nikdy použít `eject`. Kurátorovaná sada funkcí je vhodná pro malé a střední nasazení a neměli byste se cítit povinni tuto funkci používat. Chápeme však, že tento nástroj by nebyl užitečný, kdybyste si jej nemohli přizpůsobit, až na to budete připraveni.

## Použité technologie

*   **Framework/Knihovna:** [React](https://reactjs.org/)
*   **Jazyk:** [TypeScript](https://www.typescriptlang.org/)
*   **Stylování:**
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [Material UI (MUI)](https://mui.com/)
*   **Routing:** [React Router](https://reactrouter.com/)
*   **Stavový management:** React Context API (a vlastní hooky)
*   **API komunikace:** Fetch API, typy generované pomocí `openapi-typescript`
*   **Autentizace:** [Microsoft Authentication Library (MSAL) for React](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react) pro Azure AD B2C
*   **Grafy:**
    *   [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
    *   [Recharts](https://recharts.org/)
*   **Build nástroje:** [Create React App (react-scripts)](https://create-react-app.dev/)

## Struktura projektu (orientační)

*   `public/`: Statické soubory a `index.html`.
*   `src/`: Zdrojový kód aplikace.
    *   `api-types.ts`: Automaticky generované typy z backend API.
    *   `assets/`: Obrázky, ikony a další statické zdroje.
    *   `components/`: Opakovaně použitelné React komponenty.
        *   `Dashboard/`: Komponenty specifické pro dashboard.
        *   `Loans/`: Komponenty pro správu půjček.
        *   `shared/`: Obecné sdílené komponenty (např. ErrorBoundary, Layout).
    *   `context/`: React Contexty (např. `AuthContext`).
    *   `hooks/`: Vlastní React Hooky (např. `useDashboardData`, `useAuth`).
    *   `pages/`: Hlavní stránkové komponenty (pokud je struktura založena na stránkách).
    *   `services/`: Služby pro komunikaci s API a jinou business logiku (např. `loanService`, `userService`).
    *   `types/`: Ručně definované TypeScript typy a rozhraní.
    *   `utils/`: Pomocné funkce.
    *   `App.tsx`: Hlavní komponenta aplikace, obsahuje routing.
    *   `index.tsx`: Vstupní bod aplikace.
*   `package.json`: Seznam závislostí a skriptů projektu.
*   `tsconfig.json`: Konfigurace TypeScriptu.
*   `tailwind.config.js`: Konfigurace Tailwind CSS.

## Nový formulář pro půjčky

### Funkce a vylepšení

#### 🎨 Moderní UX Design
- **Krokový formulář**: Rozdělení do 4 logických kroků pro lepší orientaci
- **Responsivní design**: Optimalizováno pro desktop i mobilní zařízení
- **Vizuální feedback**: Animace, hover efekty a barevné indikátory
- **Gradient header**: Atraktivní vizuální prezentace

#### 📋 Kroky formuláře

1. **Základní údaje**
   - ID půjčky z FireFish
   - Status (Aktivní/Uzavřená)
   - Datum půjčky a doba splatnosti
   - Automatický výpočet data splacení

2. **Finanční detaily**
   - Částka půjčky v CZK
   - Úroková sazba v %
   - Automatický výpočet částky k splacení

3. **Bitcoin transakce**
   - FireFish poplatky
   - Transakční poplatky
   - Kolaterál s možností automatického přepočtu
   - Nakoupené množství BTC

4. **Přehled**
   - Souhrnné karty s finančními údaji
   - Bitcoin přehled s aktuální hodnotou
   - Kontrola všech zadaných údajů

#### 🔧 Technické funkce

- **Automatické výpočty**: Datum splacení, částka k splacení, celkové poplatky
- **Validace formuláře**: Kontrola povinných polí a formátů
- **Přepočet kolaterálu**: Na základě LTV a aktuální ceny BTC
- **Synchronizace dat**: Automatická synchronizace s backend API
- **Chybové hlášky**: Uživatelsky přívětivé zprávy v češtině

#### 💡 UX vylepšení

- **Progress indikátor**: Vizuální zobrazení postupu vyplňování
- **Tooltips**: Nápověda pro složitější pole
- **Sticky navigace**: Tlačítka vždy dostupná na spodku obrazovky
- **Barevné kódování**: Různé barvy pro různé typy informací
- **Hover efekty**: Interaktivní prvky s vizuální odezvou

### Použité technologie

- **Ant Design**: Moderní UI komponenty
- **React Hooks**: Správa stavu a side effects
- **TypeScript**: Type safety a lepší developer experience
- **dayjs**: Práce s daty a časem
- **CSS-in-JS**: Stylování s možností dynamických změn

### Instalace a spuštění

```bash
# Instalace závislostí
npm install

# Spuštění dev serveru
npm run dev

# Build pro produkci
npm run build
```

### API integrace

Formulář je plně integrován s backend API:
- Načítání existujících půjček pro editaci
- Vytváření nových půjček
- Aktualizace existujících půjček
- Načítání aktuální ceny BTC a LTV

### Budoucí vylepšení

- [ ] Drag & drop pro nahrávání dokumentů
- [ ] Pokročilé grafy a vizualizace
- [ ] Export do PDF
- [ ] Offline podpora
- [ ] Notifikace a upozornění
