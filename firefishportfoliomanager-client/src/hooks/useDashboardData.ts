import { useState, useEffect, useCallback } from 'react';
import { Loan /*, LoanStatus */ } from '../types/loanTypes'; // LoanStatus removed
import { UserDto } from '../types/userTypes';
import { fetchCurrentUser, fetchInternalBtcPrice } from '../services/userService';
import { fetchLoans as apiFetchLoans } from '../services/loanService'; // Alias to avoid naming conflict
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  user: UserDto;
  loans: Loan[];
  btcPrice: number;
  // Můžeme přidat další odvozené/vypočítané hodnoty zde, pokud se často používají
  // Například:
  // activeLoans: Loan[];
  // recentLoansSummary: any[]; // typ pro RecentLoans component
}

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({ 
    user: {} as UserDto, 
    loans: [], 
    btcPrice: 0 
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tokenGetter = getAccessToken;
      // Fetch user, loans a BTC cenu současně
      const [userData, loansData, btcPriceData] = await Promise.all([
        fetchCurrentUser(tokenGetter),
        apiFetchLoans(tokenGetter),
        fetchInternalBtcPrice(tokenGetter),
      ]);

      const btcPrice = btcPriceData?.priceCzk ?? 0;

      setDashboardData({
        user: userData,
        loans: loansData,
        btcPrice: btcPrice,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
      console.error('Error loading dashboard data:', err);
      // Reset data on error?
      setDashboardData({ user: {} as UserDto, loans: [], btcPrice: 0 }); 
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    dashboardData,
    isLoading,
    error,
    refreshDashboard: loadData,
  };
}; 