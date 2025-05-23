import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { create } from 'zustand';
import { apiConfig, loginRequest } from '../authConfig';

export interface AuthState {
  isAuthenticated: boolean;
  userName: string | null;
  error: string | null;
  msalInstance: PublicClientApplication | null;
  setMsalInstance: (instance: PublicClientApplication) => void;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  setAuthState: (isAuthenticated: boolean, userName: string | null, error?: string | null) => void;
  clearError: () => void;
}

type ZustandSet = (partial: AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>), replace?: boolean | undefined) => void;
type ZustandGet = () => AuthState;

export const useAuthStore = create<AuthState>((set: ZustandSet, get: ZustandGet) => ({
  isAuthenticated: false,
  userName: null,
  error: null,
  msalInstance: null,
  setMsalInstance: (instance: PublicClientApplication) => set({ msalInstance: instance }),
  login: async () => {
    const instance = get().msalInstance;
    if (!instance) {
      console.error("MSAL instance not initialized in authStore for loginRedirect");
      set({ error: "Chyba konfigurace přihlášení." });

      return;
    }
    try {
      set({ error: null });
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("LoginRedirect initiation error (should be rare, usually handled post-redirect):", error);
      set({ error: "Přihlášení se nezdařilo. Zkontrolujte konzoli pro více detailů." });
    }
  },
  logout: () => {
    const instance = get().msalInstance;
    if (!instance) {
      console.error("MSAL instance not initialized in authStore");

      return;
    }
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    }).then(() => {
        set({ isAuthenticated: false, userName: null, error: null });
    }).catch((e: unknown) => {
        console.error("Logout failed:", e);
        set({ error: "Odhlášení se nezdařilo." });
    });
  },
  getAccessToken: async (): Promise<string | null> => {
    const instance = get().msalInstance;
    if (!instance) {
      console.warn("MSAL instance not available for getAccessToken");

      return null;
    }
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      return null;
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: apiConfig.scopes,
        account: accounts[0],
      });

      return tokenResponse.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        console.warn("Silent token acquisition failed, attempting popup:", error);
        try {
          const tokenResponse = await instance.acquireTokenPopup({
            scopes: apiConfig.scopes,
          });

          return tokenResponse.accessToken;
        } catch (popupError) {
          console.error("Popup token acquisition failed:", popupError);
          set({ error: "Nepodařilo se získat přístupový token." });

          return null;
        }
      } else {
        console.error("Failed to acquire token (non-interaction error):", error);
        set({ error: "Nepodařilo se získat přístupový token." });

        return null;
      }
    }
  },
  setAuthState: (isAuthenticated: boolean, userName: string | null, error: string | null = null) => {
    set({ isAuthenticated, userName, error });
  },
  clearError: () => set({ error: null }),
})); 