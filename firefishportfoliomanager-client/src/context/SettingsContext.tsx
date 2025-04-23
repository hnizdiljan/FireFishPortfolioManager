import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchInternalBtcPrice } from '../services/userService';

// Define the shape of user settings
export interface UserSettings {
  ltv: number; // Loan-to-Value ratio (default 70%)
  currentBtcPrice: number; // Current BTC price in CZK
  defaultBitcoinProfitRatio: number; // Default % of profit to hold in BTC
}

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
}

// Create context with default values
const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: false,
  error: null,
  updateSettings: async () => false,
});

// Default settings
const defaultSettings: UserSettings = {
  ltv: 70, // 70% is a common default LTV
  currentBtcPrice: 0, // Will be fetched from API
  defaultBitcoinProfitRatio: 50, // Default 50%
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { userName, getAccessToken } = useAuth();

  // Fetch settings from API or localStorage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // Try to load from localStorage first (for quick load)
        let loadedSettings: UserSettings | null = null;
        const storedSettings = localStorage.getItem('userSettings');
        if (storedSettings) {
          loadedSettings = JSON.parse(storedSettings);
          setSettings(loadedSettings);
        }

        // Then try to get from API (to ensure we have the latest)
        if (userName) {
          // TODO: Implement API call to get user settings
          // const response = await fetchUserSettings(getAccessToken, userName);
          // if (response) {
          //   loadedSettings = response;
          //   setSettings(response);
          //   localStorage.setItem('userSettings', JSON.stringify(response));
          // }
        }

        // If no settings found, use defaults
        if (!loadedSettings) {
          loadedSettings = defaultSettings;
          setSettings(defaultSettings);
          localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        }

        // Fetch current BTC price from internal API
        try {
          if (getAccessToken) {
            const token = await getAccessToken();
            if (token) {
              const btcPriceResult = await fetchInternalBtcPrice(async () => token);
              if (btcPriceResult && typeof btcPriceResult.priceCzk === 'number') {
                setSettings(prev => {
                  const updatedSettings = {
                    ...prev,
                    currentBtcPrice: btcPriceResult.priceCzk
                  } as UserSettings;
                  localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
                  return updatedSettings;
                });
              }
            } else {
              // Pokud není token, neaktualizuj cenu a nehlásí error
              setSettings(prev => {
                const updatedSettings = {
                  ...prev,
                  currentBtcPrice: 0
                } as UserSettings;
                localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
                return updatedSettings;
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch BTC price from internal API:', err);
          setSettings(prev => {
            const updatedSettings = {
              ...prev,
              currentBtcPrice: 0
            } as UserSettings;
            localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
            return updatedSettings;
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userName, getAccessToken]);

  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    try {
      const updatedSettings = { ...settings, ...newSettings } as UserSettings;
      setSettings(updatedSettings);
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));

      // TODO: Save to API
      // if (userName) {
      //   await saveUserSettings(getAccessToken, userName, updatedSettings);
      // }

      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings context
export const useSettings = () => useContext(SettingsContext); 