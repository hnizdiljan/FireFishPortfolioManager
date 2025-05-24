import { useState, useEffect, useCallback } from 'react';
import { useAuthStore, AuthState } from '@store/authStore';
import { 
  fetchBtcPriceHistory, 
  BtcPriceHistoryItem, 
  createPriceLookupMap,
  getPriceFromMap 
} from '@/services/marketService';

interface UseBtcPriceHistoryReturn {
  priceHistory: BtcPriceHistoryItem[];
  priceMap: Map<string, number>;
  isLoading: boolean;
  error: string | null;
  getPriceForDate: (date: Date, fallbackPrice: number) => number;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing BTC price history
 * @param fromDate Optional start date for price history
 * @param toDate Optional end date for price history
 */
export const useBtcPriceHistory = (
  fromDate?: string,
  toDate?: string
): UseBtcPriceHistoryReturn => {
  const [priceHistory, setPriceHistory] = useState<BtcPriceHistoryItem[]>([]);
  const [priceMap, setPriceMap] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await fetchBtcPriceHistory(getAccessToken, fromDate, toDate);
      setPriceHistory(history);
      
      // Create price lookup map for efficient queries
      const map = createPriceLookupMap(history);
      setPriceMap(map);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch BTC price history';
      setError(message);
      console.error('Error fetching BTC price history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, fromDate, toDate]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to get price for a specific date
  const getPriceForDate = useCallback((date: Date, fallbackPrice: number): number => {
    return getPriceFromMap(priceMap, date, fallbackPrice);
  }, [priceMap]);

  return {
    priceHistory,
    priceMap,
    isLoading,
    error,
    getPriceForDate,
    refetch: fetchData
  };
}; 