import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { fetchInternalBtcPrice } from '@services/userService'; // Použit alias

export interface UserSettings {
  ltv: number;
  currentBtcPrice: number;
  defaultBitcoinProfitRatio: number;
}

export interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  fetchBtcPriceAndUpdate: () => Promise<void>;
}

const defaultSettingsData: UserSettings = {
  ltv: 70,
  currentBtcPrice: 0,
  defaultBitcoinProfitRatio: 50,
};

type ZustandSet = (partial: SettingsState | Partial<SettingsState> | ((state: SettingsState) => SettingsState | Partial<SettingsState>), replace?: boolean | undefined) => void;
type ZustandGet = () => SettingsState;

export const useSettingsStore = create<SettingsState>((set: ZustandSet, get: ZustandGet) => ({
  settings: null,
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    let loadedSettings: UserSettings | null = null;
    try {
      const storedSettings = localStorage.getItem('userSettings');
      if (storedSettings) {
        loadedSettings = JSON.parse(storedSettings) as UserSettings;
      }

      if (loadedSettings) {
        set({ settings: loadedSettings });
      } else {
        loadedSettings = defaultSettingsData;
        set({ settings: defaultSettingsData });
        localStorage.setItem('userSettings', JSON.stringify(defaultSettingsData));
      }

      if (get().settings) {
        await get().fetchBtcPriceAndUpdate(); // Tato funkce by měla vyhodit chybu, pokud selže, aby ji zachytil tento catch
      }

    } catch (err) {
      console.error('Error loading settings or fetching price:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during settings load';
      set({ error: errorMsg, settings: get().settings || defaultSettingsData, loading: false });
      // Uložíme aktuální (nebo defaultní) nastavení, i když cena BTC selhala
      if (!localStorage.getItem('userSettings')) {
          localStorage.setItem('userSettings', JSON.stringify(defaultSettingsData));
      }
    } finally {
      // Zajistíme, že loading je vždy false po dokončení, bez ohledu na úspěch/neúspěch fetchBtcPriceAndUpdate
      set(state => ({ ...state, loading: false }));
    }
  },

  fetchBtcPriceAndUpdate: async () => {
    const getAccessToken = useAuthStore.getState().getAccessToken;
    const token = await getAccessToken();
    const baseSettings = get().settings || defaultSettingsData;

    if (!token) {
      console.warn("No access token available to fetch BTC price.");
      const updatedSettings: UserSettings = { ...baseSettings, currentBtcPrice: 0 };
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      set({ settings: updatedSettings, error: "Přístupový token není k dispozici pro načtení ceny BTC." });

      // Nevyhazujeme chybu zde, protože loadSettings může pokračovat s defaultní/poslední cenou
      return;
    }

    try {
      const btcPriceResult = await fetchInternalBtcPrice(async () => token);
      if (btcPriceResult && typeof btcPriceResult.priceCzk === 'number') {
        const updatedSettings: UserSettings = { ...baseSettings, currentBtcPrice: btcPriceResult.priceCzk };
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
        set({ settings: updatedSettings, error: null });
      } else {
        console.error("Invalid BTC price data received from fetchInternalBtcPrice", btcPriceResult);
        const updatedSettings: UserSettings = { ...baseSettings, currentBtcPrice: 0 };
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
        set({ settings: updatedSettings, error: "Neplatná data o ceně BTC." });
      }
    } catch (err) {
      console.error('Failed to fetch BTC price from internal API:', err);
      const updatedSettings: UserSettings = { ...baseSettings, currentBtcPrice: 0 };
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      const errorMsg = err instanceof Error ? err.message : 'Neznámá chyba při načítání ceny BTC.';
      set({ settings: updatedSettings, error: `Chyba při načítání ceny BTC: ${errorMsg}` });
      // Pokud chceme, aby toto selhání zastavilo loadSettings a zobrazilo chybu centrálně:
      // throw err; 
    }
  },

  updateSettings: async (newSettings: Partial<UserSettings>) => {
    const currentSettings = get().settings || defaultSettingsData;
    
    const mergedSettings: UserSettings = { ...currentSettings, ...newSettings };
    set({ settings: mergedSettings, error: null });
    localStorage.setItem('userSettings', JSON.stringify(mergedSettings));

    try {
      // TODO: API call
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error updating settings';
      set({ error: errorMsg });

      return false;
    }
  },
}));

// useSettingsStore.getState().loadSettings(); 