// Status display properties
export const statusDisplay = {
  Active: { text: 'Active', color: 'bg-green-100 text-green-800' },
  Closed: { text: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

// Format currency as CZK
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format BTC with appropriate precision
export const formatBtc = (amount: number): string => {
  return `${amount.toFixed(8)} BTC`;
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Můžeme sem přidat další pomocné funkce pro práci s půjčkami 