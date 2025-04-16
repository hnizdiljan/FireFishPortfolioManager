import { useState, useEffect, useCallback } from 'react';
import { Loan /*, LoanStatus */ } from '../types/loanTypes'; // LoanStatus removed
import { UserDto } from '../types/userTypes';
import { fetchCurrentUser } from '../services/userService';
import { fetchLoans as apiFetchLoans } from '../services/loanService'; // Alias to avoid naming conflict
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  user: UserDto | null;
  loans: Loan[];
  btcPrice: number | null;
  // Můžeme přidat další odvozené/vypočítané hodnoty zde, pokud se často používají
  // Například:
  // activeLoans: Loan[];
  // recentLoansSummary: any[]; // typ pro RecentLoans component
}

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({ 
    user: null, 
    loans: [], 
    btcPrice: null 
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tokenGetter = getAccessToken;
      // Fetch user a loans concurrently
      const [userData, loansData] = await Promise.all([
        fetchCurrentUser(tokenGetter),
        apiFetchLoans(tokenGetter),
      ]);

      // Pokud chceš cenu BTC, můžeš ji získat z loanů nebo z API /api/User/btc-price
      // Zde nastavíme btcPrice na null (nebo např. průměr z loanů)
      const btcPrices = loansData.map(l => l.currentBtcPrice).filter(p => typeof p === 'number' && !isNaN(p));
      const btcPrice = btcPrices.length > 0 ? btcPrices.reduce((a, b) => a + b, 0) / btcPrices.length : null;

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
      setDashboardData({ user: null, loans: [], btcPrice: null }); 
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