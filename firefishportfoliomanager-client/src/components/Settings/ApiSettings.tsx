import React from 'react';

interface ApiSettingsProps {
  apiKey: string;
  setApiKey: (val: string) => void;
  apiSecret: string;
  setApiSecret: (val: string) => void;
  showSecret: boolean;
  setShowSecret: (val: boolean) => void;
  hasApiCredentials: boolean;
  handleSaveApiKeys: (e: React.FormEvent) => void;
  saving: boolean;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiKey,
  setApiKey,
  apiSecret,
  setApiSecret,
  showSecret,
  setShowSecret,
  hasApiCredentials,
  handleSaveApiKeys,
  saving,
}) => (
  <div className="bg-white shadow-md rounded-lg p-6">
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Coinmate API Integration</h2>
      <p className="text-gray-600 mb-2">
        Enter your Coinmate API credentials to enable automatic sell order execution.
      </p>
      <p className="text-sm text-blue-600 font-medium mb-4">
        {hasApiCredentials ? '✓ API credentials seem to be configured (saved successfully).' : '✗ API credentials might not be set or need saving.'}
      </p>
    </div>
    <form onSubmit={handleSaveApiKeys}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coinmate API Key
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="block w-full max-w-lg border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your Coinmate API key"
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coinmate API Secret
        </label>
        <div className="relative max-w-lg">
          <input
            type={showSecret ? 'text' : 'password'}
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your Coinmate API secret"
            required
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400"
          >
            {showSecret ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1 text-sm text-red-500">
          Your API secret will be securely stored and never displayed again.
        </p>
      </div>
      <div className="p-4 bg-gray-50 rounded-md mb-6">
        <h3 className="text-sm font-medium text-gray-800 mb-2">API Permissions Required</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>View account balance</li>
          <li>Place buy/sell orders</li>
          <li>View order status</li>
        </ul>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save API Keys'}
        </button>
      </div>
    </form>
  </div>
);

export default ApiSettings; 