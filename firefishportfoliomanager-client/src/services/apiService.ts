// import { useAuth } from '../context/AuthContext'; // Corrected path
// import { InteractionRequiredAuthError } from '@azure/msal-browser'; // Removed unused import
import { apiConfig } from "../authConfig";

// Typ pro funkci, která umí získat token
type GetAccessTokenFunction = () => Promise<string | null>;

// Funkce pro volání API, která přijímá getAccessToken funkci
export const callApi = async <T,>(url: string, getAccessToken: GetAccessTokenFunction, options?: RequestInit): Promise<T> => {
  
  const token = await getAccessToken();
  
  if (!token) {
    // Pokud nemáme token, pravděpodobně uživatel není přihlášen nebo došlo k chybě při získávání
    // AuthContext by měl zajistit přesměrování nebo zobrazení chyby
    throw new Error("Přístupový token není k dispozici.");
  }

  const headers = new Headers(options?.headers);
  headers.append("Authorization", `Bearer ${token}`);
  // Content-Type přidáme jen pokud posíláme body a není už nastaven
  if (options?.body && !headers.has("Content-Type")) {
      headers.append("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${apiConfig.baseUrl}${url}`, {
      ...options,
      headers
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error ${response.status}: ${errorBody}`);
        throw new Error(`API volání selhalo: ${response.status} ${response.statusText}. ${errorBody}`);
    }

    // Pokud odpověď nemá obsah (např. 204 No Content), vrátíme null nebo specifický typ
    if (response.status === 204) {
        return null as T; // Nebo upravit podle potřeby
    }

    return await response.json() as T;
  } catch (error) {
    console.error("Chyba při volání API:", error);
    // Zde by se mohla přidat specifická logika pro opakování nebo jiné zpracování chyb
    throw error; // Znovu vyhodíme chybu, aby ji mohla zachytit volající funkce
  }
};
