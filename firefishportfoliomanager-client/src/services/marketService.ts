import { callApi } from "./apiService";
import { GetAccessTokenFunction } from "../types";

export interface BtcPriceHistoryItem {
  date: string;
  price: number;
  source: string;
}

/**
 * Fetch historical BTC/CZK price data
 * @param getAccessToken Function to retrieve the access token
 * @param fromDate Optional start date (ISO string)
 * @param toDate Optional end date (ISO string)
 */
export const fetchBtcPriceHistory = async (
  getAccessToken: GetAccessTokenFunction,
  fromDate?: string,
  toDate?: string
): Promise<BtcPriceHistoryItem[]> => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const url = `/api/market/btc-price-history${params.toString() ? `?${params.toString()}` : ''}`;

  return callApi<BtcPriceHistoryItem[]>(url, getAccessToken);
};

/**
 * Get BTC price for a specific date from historical data
 * @param priceHistory Array of historical price data
 * @param targetDate Date to find price for
 * @returns Price for the date or null if not found
 */
export const getBtcPriceForDate = (
  priceHistory: BtcPriceHistoryItem[],
  targetDate: Date
): number | null => {
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  // First try exact match
  const exactMatch = priceHistory.find(item => item.date === targetDateStr);
  if (exactMatch) {
    return exactMatch.price;
  }
  
  // If no exact match, find closest previous date
  const sortedHistory = priceHistory
    .filter(item => item.date <= targetDateStr)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  return sortedHistory.length > 0 ? sortedHistory[0].price : null;
};

/**
 * Create a price lookup map for efficient date-based price queries
 * @param priceHistory Array of historical price data
 * @returns Map with date strings as keys and prices as values
 */
export const createPriceLookupMap = (
  priceHistory: BtcPriceHistoryItem[]
): Map<string, number> => {
  const priceMap = new Map<string, number>();
  
  // Sort by date to ensure chronological order
  const sortedHistory = [...priceHistory].sort((a, b) => a.date.localeCompare(b.date));
  
  sortedHistory.forEach(item => {
    priceMap.set(item.date, item.price);
  });
  
  return priceMap;
};

/**
 * Get BTC price for a date using the price lookup map with fallback logic
 * @param priceMap Map of dates to prices
 * @param targetDate Date to find price for
 * @param fallbackPrice Price to use if no historical data is available
 * @returns Price for the date
 */
export const getPriceFromMap = (
  priceMap: Map<string, number>,
  targetDate: Date,
  fallbackPrice: number
): number => {
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  // Try exact match first
  const exactPrice = priceMap.get(targetDateStr);
  if (exactPrice !== undefined) {
    return exactPrice;
  }
  
  // Find closest previous date
  let bestDate = '';
  let bestPrice = fallbackPrice;
  
  for (const [dateStr, price] of priceMap.entries()) {
    if (dateStr <= targetDateStr && dateStr > bestDate) {
      bestDate = dateStr;
      bestPrice = price;
    }
  }
  
  return bestPrice;
}; 