import React, { useState, useEffect } from 'react';
import { fetchCurrentUser, updateUserSettings, updateCoinmateCredentials, fetchInternalBtcPrice, fetchBtcAth } from '../../services/userService';
import { UserDto } from '../../types/userTypes';
import { useAuth } from '../../context/AuthContext';
import MessageAlert from './MessageAlert';
import UserInfo from './UserInfo';
import PortfolioSettings from './PortfolioSettings';
import ApiSettings from './ApiSettings';

const SettingsPage: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [settings, setSettings] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'api'>('portfolio');
  const [allocatedBtc, setAllocatedBtc] = useState<number>(0);
  const [drawdownFromAth, setDrawdownFromAth] = useState<number>(20);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [hasApiCredentials, setHasApiCredentials] = useState<boolean>(false);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcAth, setBtcAth] = useState<number | null>(null);
  const [liquidationPrice, setLiquidationPrice] = useState<number | null>(null);
  const [ltvPercent, setLtvPercent] = useState<number>(50);
  const [lastChanged, setLastChanged] = useState<'drawdown' | 'liquidation' | 'ltv' | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const userData = await fetchCurrentUser(getAccessToken);
        setSettings(userData);
        setAllocatedBtc(userData.allocatedBtc);
        setDrawdownFromAth(userData.drawdownFromAth);
        setHasApiCredentials(true);
        setLiquidationPrice(userData.absoluteLiquidationPrice);
        setLtvPercent(userData.ltvPercent);
        const btcPriceData = await fetchInternalBtcPrice(getAccessToken);
        setBtcPrice(btcPriceData.priceCzk);
        let athCzk = 1800000;
        try {
          const athData = await fetchBtcAth(getAccessToken);
          if (athData && typeof athData.athCzk === 'number') {
            athCzk = athData.athCzk;
          }
        } catch (err) {
          console.error('Failed to fetch BTC ATH from API:', err);
        }
        setBtcAth(athCzk);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setMessage({ text: 'Failed to load settings.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [getAccessToken]);

  const athPrice = btcAth ?? 1800000;

  useEffect(() => {
    if (lastChanged === 'drawdown' && btcPrice && athPrice) {
      const newLiquidationPrice = Math.round(athPrice * (1 - drawdownFromAth / 100));
      setLiquidationPrice(newLiquidationPrice);
      const newLtvPercent = Math.round(100 * (newLiquidationPrice / btcPrice));
      setLtvPercent(newLtvPercent);
    }
  }, [drawdownFromAth, athPrice, btcPrice]);

  useEffect(() => {
    if (lastChanged === 'liquidation' && btcPrice && athPrice && liquidationPrice !== null) {
      const newDrawdown = Math.round(100 * (1 - liquidationPrice / athPrice));
      setDrawdownFromAth(newDrawdown);
      const newLtvPercent = Math.round(100 * (liquidationPrice / btcPrice));
      setLtvPercent(newLtvPercent);
    }
  }, [liquidationPrice, athPrice, btcPrice]);

  useEffect(() => {
    if (lastChanged === 'ltv' && btcPrice && athPrice) {
      const newLiquidationPrice = Math.round(btcPrice * (ltvPercent / 100));
      setLiquidationPrice(newLiquidationPrice);
      const newDrawdown = Math.round(100 * (1 - newLiquidationPrice / athPrice));
      setDrawdownFromAth(newDrawdown);
    }
  }, [ltvPercent, btcPrice, athPrice]);

  const platformLimitPrice = btcPrice ? btcPrice * 0.5 : null;
  const effectiveLiquidationPrice = (liquidationPrice && platformLimitPrice)
    ? Math.min(liquidationPrice, platformLimitPrice)
    : null;
  const maxLoanAmount = (allocatedBtc && effectiveLiquidationPrice)
    ? allocatedBtc * effectiveLiquidationPrice
    : 0;
  const ltvToCurrentPrice = (allocatedBtc && btcPrice && maxLoanAmount)
    ? (maxLoanAmount / (allocatedBtc * btcPrice)) * 100
    : 0;
  const showPlatformLimitWarning = ltvToCurrentPrice > 50;
  const isDrawdownValid = drawdownFromAth >= 1 && drawdownFromAth <= 100;
  const isLtvValid = ltvPercent >= 1 && ltvPercent <= 50;
  const showLtvCapWarning = ltvToCurrentPrice > 50;
  const effectiveDrawdownOutput = (effectiveLiquidationPrice && athPrice)
    ? (100 * (1 - effectiveLiquidationPrice / athPrice)).toFixed(2)
    : '';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const roundedAllocatedBtc = Math.round(allocatedBtc);
      const roundedDrawdownFromAth = Math.round(drawdownFromAth);
      const roundedLiquidationPrice = Math.round(liquidationPrice ?? 0);
      const roundedLtvPercent = Math.round(ltvPercent);
      const settingsToUpdate = {
        allocatedBtc: roundedAllocatedBtc,
        drawdownFromAth: roundedDrawdownFromAth,
        absoluteLiquidationPrice: roundedLiquidationPrice,
        ltvPercent: roundedLtvPercent,
      };
      const updatedUser = await updateUserSettings(getAccessToken, settingsToUpdate);
      setSettings(updatedUser);
      setMessage({ text: 'Portfolio settings saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ text: `Failed to save settings: ${errorMessage}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateCoinmateCredentials(getAccessToken, { apiKey, apiSecret });
      setHasApiCredentials(true);
      setMessage({ text: 'API credentials saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      setApiKey('');
      setApiSecret('');
      setShowSecret(false);
    } catch (error) {
      console.error('Error saving API keys:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ text: `Failed to save API keys: ${errorMessage}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <MessageAlert message={message} />
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Portfolio Settings
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Coinmate API
            </button>
          </nav>
        </div>
      </div>
      {activeTab === 'portfolio' && (
        <>
          <UserInfo user={settings} />
          <PortfolioSettings
            allocatedBtc={allocatedBtc}
            setAllocatedBtc={setAllocatedBtc}
            drawdownFromAth={drawdownFromAth}
            setDrawdownFromAth={setDrawdownFromAth}
            liquidationPrice={liquidationPrice}
            setLiquidationPrice={setLiquidationPrice}
            ltvPercent={ltvPercent}
            setLtvPercent={setLtvPercent}
            lastChanged={lastChanged}
            setLastChanged={setLastChanged}
            isDrawdownValid={isDrawdownValid}
            isLtvValid={isLtvValid}
            handleSaveSettings={handleSaveSettings}
            saving={saving}
            effectiveLiquidationPrice={effectiveLiquidationPrice}
            maxLoanAmount={maxLoanAmount}
            showPlatformLimitWarning={showPlatformLimitWarning}
            platformLimitPrice={platformLimitPrice}
            showLtvCapWarning={showLtvCapWarning}
            btcPrice={btcPrice}
            effectiveDrawdownOutput={effectiveDrawdownOutput}
            ltvToCurrentPrice={ltvToCurrentPrice}
          />
        </>
      )}
      {activeTab === 'api' && (
        <ApiSettings
          apiKey={apiKey}
          setApiKey={setApiKey}
          apiSecret={apiSecret}
          setApiSecret={setApiSecret}
          showSecret={showSecret}
          setShowSecret={setShowSecret}
          hasApiCredentials={hasApiCredentials}
          handleSaveApiKeys={handleSaveApiKeys}
          saving={saving}
        />
      )}
    </div>
  );
};

export default SettingsPage;
