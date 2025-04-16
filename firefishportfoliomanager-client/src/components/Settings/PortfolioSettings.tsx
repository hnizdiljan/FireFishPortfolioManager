import React from 'react';

interface PortfolioSettingsProps {
  allocatedBtc: number;
  setAllocatedBtc: (val: number) => void;
  drawdownFromAth: number;
  setDrawdownFromAth: (val: number) => void;
  liquidationPrice: number | null;
  setLiquidationPrice: (val: number) => void;
  ltvPercent: number;
  setLtvPercent: (val: number) => void;
  lastChanged: 'drawdown' | 'liquidation' | 'ltv' | null;
  setLastChanged: (val: 'drawdown' | 'liquidation' | 'ltv') => void;
  isDrawdownValid: boolean;
  isLtvValid: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
  saving: boolean;
  effectiveLiquidationPrice: number | null;
  maxLoanAmount: number;
  showPlatformLimitWarning: boolean;
  platformLimitPrice: number | null;
  showLtvCapWarning: boolean;
  btcPrice: number | null;
  effectiveDrawdownOutput: string;
  ltvToCurrentPrice: number;
}

const PortfolioSettings: React.FC<PortfolioSettingsProps> = ({
  allocatedBtc,
  setAllocatedBtc,
  drawdownFromAth,
  setDrawdownFromAth,
  liquidationPrice,
  setLiquidationPrice,
  ltvPercent,
  setLtvPercent,
  lastChanged,
  setLastChanged,
  isDrawdownValid,
  isLtvValid,
  handleSaveSettings,
  saving,
  effectiveLiquidationPrice,
  maxLoanAmount,
  showPlatformLimitWarning,
  platformLimitPrice,
  showLtvCapWarning,
  btcPrice,
  effectiveDrawdownOutput,
  ltvToCurrentPrice,
}) => (
  <div className="bg-white shadow-md rounded-lg p-6">
    <form onSubmit={handleSaveSettings}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Parameters</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Allocated BTC
        </label>
        <div className="flex items-center">
          <input
            type="number"
            value={allocatedBtc}
            onChange={(e) => { setAllocatedBtc(Math.round(Number(e.target.value))); }}
            className="block w-full max-w-lg border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            step="1"
            required
          />
          <span className="ml-2 text-gray-500">BTC</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Amount of BTC you want to allocate for Fire Fish loans
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Drawdown from ATH to secure with collateral (%)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            value={drawdownFromAth}
            onChange={(e) => { 
              const val = Math.round(Number(e.target.value));
              if (val >= 1 && val <= 100) { setDrawdownFromAth(val); setLastChanged('drawdown'); }
            }}
            className="block w-full max-w-lg border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="100"
            step="1"
            required
          />
          <span className="ml-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          How much drop from the all-time-high (ATH) price you want to secure with collateral
        </p>
        {!isDrawdownValid && <div className="text-red-600 text-xs mt-1">Drawdown musí být v rozsahu 1-100 %.</div>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Absolute liquidation price (CZK)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            value={liquidationPrice ?? ''}
            onChange={(e) => { setLiquidationPrice(Math.round(Number(e.target.value))); setLastChanged('liquidation'); }}
            className="block w-full max-w-lg border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            step="1"
            required
          />
          <span className="ml-2 text-gray-500">CZK</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          The price down to which your collateral will cover your loans
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LTV (%)
        </label>
        <div className="flex items-center">
          <input
            type="number"
            value={ltvPercent}
            onChange={(e) => { 
              const val = Math.round(Number(e.target.value));
              if (val >= 1 && val <= 50) { setLtvPercent(val); setLastChanged('ltv'); }
            }}
            className="block w-full max-w-lg border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="50"
            step="1"
            required
          />
          <span className="ml-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Loan-to-Value ratio you want to accept (max 50%)
        </p>
        {!isLtvValid && <div className="text-red-600 text-xs mt-1">LTV musí být v rozsahu 1-50 %.</div>}
      </div>
      <div className="mb-6 p-4 rounded-md bg-blue-50">
        <h3 className="font-medium mb-2 text-blue-800">Maximum Loan Amount</h3>
        <p className="text-2xl font-bold text-blue-900">
          {effectiveLiquidationPrice ? Math.round(maxLoanAmount).toLocaleString() : '...'} CZK
        </p>
        {showPlatformLimitWarning && (
          <div className="mt-2 text-sm text-red-600">
            Upozornění: Platforma FireFish dovoluje maximální LTV 50 %, proto bude vaše skutečná likvidační cena {platformLimitPrice ? Math.round(platformLimitPrice).toLocaleString() : '...'} CZK.
          </div>
        )}
        {showLtvCapWarning && (
          <div className="mb-4 p-4 rounded-md bg-red-100 border border-red-400 text-red-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
            <span>
              Hodnoty parametrů nejsou v povoleném rozsahu. Maximální hodnota LTV je 50 %. Hodnoty ostatních parametrů byly upraveny podle tohoto limitu.
            </span>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-700">
          <div>Efektivní likvidační cena: {effectiveLiquidationPrice ? Math.round(effectiveLiquidationPrice).toLocaleString() : '...'} CZK</div>
          <div>Aktuální cena BTC: {btcPrice ? Math.round(btcPrice).toLocaleString() : '...'} CZK</div>
          <div>Effective drawdown from ATH: {effectiveDrawdownOutput}%</div>
          <div>LTV (k aktuální ceně BTC): {showLtvCapWarning ? '50.00' : ltvToCurrentPrice.toFixed(2)}%</div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  </div>
);

export default PortfolioSettings; 