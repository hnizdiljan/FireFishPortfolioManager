import { test, expect } from '@playwright/test';

// Tento test předpokládá, že aplikace používá Microsoft login (MSAL)
// a že testovací účet je možné použít v testovacím prostředí.

test('login with test account via MCP server', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Klikni na tlačítko "Přihlásit se pomocí Microsoft"
  await page.getByRole('button', { name: /Přihlásit se pomocí Microsoft/i }).click();

  // Počkej na přesměrování na MCP login stránku
  await page.waitForURL(/mcp\.|mcp-server|mcp-login|mcp\//i, { timeout: 10000 });

  // Vyplň e-mail (MCP login stránka)
  await page.getByLabel(/Email|E-mail|Uživatelské jméno|Username/i, { exact: false }).fill('mpn@softim.cz');
  await page.getByRole('button', { name: /Next|Další|Pokračovat|Continue|Přihlásit se/i }).click();

  // Vyplň heslo
  await page.getByLabel(/Password|Heslo/i, { exact: false }).fill('7tZ9y.eT4IM5');
  await page.getByRole('button', { name: /Sign in|Přihlásit se|Login|Přihlásit/i }).click();

  // Pokud je třeba, potvrď "Ano" pro zůstat přihlášen
  const staySignedIn = page.getByRole('button', { name: /Ano|Yes/i });
  if (await staySignedIn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await staySignedIn.click();
  }

  // Počkej na přesměrování zpět do aplikace
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 });

  // Očekávej, že se zobrazí dashboard nebo jiný prvek pro přihlášeného uživatele
  await expect(page.getByText(/Fire Fish Portfolio Manager|Dashboard|Odhlásit|Sign out/i)).toBeVisible();
}); 