import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  const { userName } = useAuth();

  // Fetch settings from API or localStorage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // Try to load from localStorage first (for quick load)
        const storedSettings = localStorage.getItem('userSettings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }

        // Then try to get from API (to ensure we have the latest)
        if (userName) {
          // TODO: Implement API call to get user settings
          // const response = await fetchUserSettings(getAccessToken, userName);
          // if (response) {
          //   setSettings(response);
          //   localStorage.setItem('userSettings', JSON.stringify(response));
          // }
        }

        // If no settings found, use defaults
        if (!settings) {
          setSettings(defaultSettings);
          localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        }

        // Fetch current BTC price (this should be moved to a separate service)
        try {
          const response = await fetch('https://api.coinmate.io/api/ticker?currencyPair=BTC_CZK');
          const data = await response.json();
          if (data.data?.last) {
            const btcPrice = parseFloat(data.data.last);
            setSettings(prev => {
              const updatedSettings = { 
                ...prev, 
                currentBtcPrice: btcPrice 
              } as UserSettings;
              localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
              return updatedSettings;
            });
          }
        } catch (err) {
          console.error('Failed to fetch BTC price:', err);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userName, settings]);

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