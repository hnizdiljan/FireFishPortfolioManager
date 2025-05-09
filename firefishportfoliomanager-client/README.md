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
