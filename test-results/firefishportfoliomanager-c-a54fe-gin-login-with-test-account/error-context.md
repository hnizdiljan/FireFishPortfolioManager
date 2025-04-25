# Test info

- Name: login with test account
- Location: C:\Users\hnizd\source\repos\hnizdiljan\FireFishPortfolioManager\firefishportfoliomanager-client\e2e\login.spec.ts:6:5

# Error details

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
    at C:\Users\hnizd\source\repos\hnizdiljan\FireFishPortfolioManager\firefishportfoliomanager-client\e2e\login.spec.ts:13:14
```

# Page snapshot

```yaml
- heading "Fire Fish Portfolio Manager" [level=1]
- paragraph: Pro pokračování se přihlaste pomocí Microsoft účtu
- button "Přihlásit se pomocí Microsoft":
  - img
  - text: Přihlásit se pomocí Microsoft
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | // Tento test předpokládá, že aplikace používá Microsoft login (MSAL)
   4 | // a že testovací účet je možné použít v testovacím prostředí.
   5 |
   6 | test('login with test account', async ({ page }) => {
   7 |   await page.goto('http://localhost:3000/');
   8 |
   9 |   // Klikni na tlačítko "Přihlásit se pomocí Microsoft"
  10 |   await page.getByRole('button', { name: /Přihlásit se pomocí Microsoft/i }).click();
  11 |
  12 |   // Počkej na přesměrování na Microsoft login stránku
> 13 |   await page.waitForURL(/login\.microsoftonline\.com/);
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  14 |
  15 |   // Vyplň e-mail
  16 |   await page.getByLabel(/Email, phone, or Skype|E-mail|Email/i, { exact: false }).fill('mpn@softim.cz');
  17 |   await page.getByRole('button', { name: /Next|Další/i }).click();
  18 |
  19 |   // Vyplň heslo
  20 |   await page.getByLabel(/Password|Heslo/i, { exact: false }).fill('7tZ9y.eT4IM5');
  21 |   await page.getByRole('button', { name: /Sign in|Přihlásit se/i }).click();
  22 |
  23 |   // Pokud je třeba, potvrď "Ano" pro zůstat přihlášen
  24 |   const staySignedIn = page.getByRole('button', { name: /Ano|Yes/i });
  25 |   if (await staySignedIn.isVisible({ timeout: 3000 }).catch(() => false)) {
  26 |     await staySignedIn.click();
  27 |   }
  28 |
  29 |   // Počkej na přesměrování zpět do aplikace
  30 |   await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
  31 |
  32 |   // Očekávej, že se zobrazí dashboard nebo jiný prvek pro přihlášeného uživatele
  33 |   await expect(page.getByText(/Fire Fish Portfolio Manager|Dashboard|Odhlásit|Sign out/i)).toBeVisible();
  34 | }); 
```