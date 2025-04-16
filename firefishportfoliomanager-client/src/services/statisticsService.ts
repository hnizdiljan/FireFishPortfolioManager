import { useState, useEffect, useCallback } from 'react';
import { Loan, LoanStatus } from '../types/loanTypes';
import { createPortfolioService } from './portfolioService';
import { useAuth } from '../context/AuthContext';

// Types for statistics data
export interface ChartData {
  labels: string[];
  btcValues: number[];
  collateralValues: number[];
  czkValues: number[];
}

export interface StatisticsSummary {
  totalLoans: number;
  activeLoansCzk: number;
  totalBtcPurchased: number;
  totalBtcRemaining: number;
  totalProfitCzk: number;
  averageProfitPercentage: number;
}

/**
 * Hook pro práci se statistikami
 */
export const useStatisticsService = () => {
  const [statisticsSummary, setStatisticsSummary] = useState<StatisticsSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { getAccessToken } = useAuth();
  
  /**
   * Internal function to calculate statistics from loan data
   */
  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Access token not available.");
      }
      const portfolioService = createPortfolioService(getAccessToken);

      // Fetch loans (BTC price získáme z loanů nebo z API jinde)
      const loans = await portfolioService.fetchLoans();
      // Pokud potřebuješ aktuální cenu BTC, doporučuji ji získat přes API /api/User/btc-price mimo tento hook
      // Zde pro ukázku použijeme průměrnou cenu z loanů, pokud existuje
      const btcPrices = loans.map(l => l.currentBtcPrice).filter(p => typeof p === 'number' && !isNaN(p));
      const validBtcPrice = btcPrices.length > 0 ? btcPrices.reduce((a, b) => a + b, 0) / btcPrices.length : 0;

      // Calculate statistics summary
      const totalLoans = loans.length;
      const activeLoans = loans.filter((loan: Loan) => 
          loan.status === LoanStatus.Active || 
          loan.status === LoanStatus.PartiallyRepaid ||
          loan.status === LoanStatus.PendingBtcPurchase ||
          loan.status === LoanStatus.WaitingForFiat ||
          loan.status === LoanStatus.PendingBtcTransfer
      );
      const activeLoansCzk = activeLoans.reduce((sum: number, loan: Loan) => sum + (loan.loanAmountCzk || 0), 0);
      const totalBtcPurchased = loans.reduce((sum: number, loan: Loan) => sum + (loan.purchasedBtc || 0), 0);
      
      // Calculate remaining BTC (simplified - in real app would be more complex)
      const totalBtcRemaining = activeLoans.reduce((sum: number, loan: Loan) => sum + (loan.purchasedBtc || 0), 0);

      // Calculate profit using the fetched price
      const currentValue = totalBtcRemaining * validBtcPrice; 
      const totalProfitCzk = currentValue - activeLoansCzk;
      const averageProfitPercentage = activeLoansCzk > 0 
        ? (totalProfitCzk / activeLoansCzk) * 100 
        : 0;
        
      const summary: StatisticsSummary = {
        totalLoans,
        activeLoansCzk,
        totalBtcPurchased,
        totalBtcRemaining,
        totalProfitCzk,
        averageProfitPercentage: parseFloat(averageProfitPercentage.toFixed(2))
      };
      
      // Generate chart data (using fetched price for CZK values)
      const today = new Date();
      const labels: string[] = [];
      const btcValues: number[] = [];
      const collateralValues: number[] = [];
      const czkValues: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        labels.push(month.toLocaleString('default', { month: 'long' }));
      }
      
      const sortedLoans = [...loans].sort((a, b) => {
        const dateA = new Date(a.loanDate || "").getTime();
        const dateB = new Date(b.loanDate || "").getTime();
        return dateA - dateB;
      });
      
      for (let i = 0; i < 6; i++) {
        // Loans up to this month
        const monthLoans = sortedLoans.filter((_, index) => index < (i + 1) * (sortedLoans.length / 6));
        // Aktivní půjčky v daném období
        const monthActiveLoans = monthLoans.filter(l => l.status === LoanStatus.Active || l.status === LoanStatus.PartiallyRepaid || l.status === LoanStatus.PendingBtcPurchase || l.status === LoanStatus.WaitingForFiat || l.status === LoanStatus.PendingBtcTransfer);
        // Volný kolaterál
        const cumulativeCollateral = monthActiveLoans.reduce((sum, loan) => sum + (loan.collateralBtc || 0), 0);
        // Nakoupené BTC
        const cumulativeBtc = monthLoans.reduce((sum, loan) => sum + (loan.purchasedBtc || 0), 0);
        // Hodnota půjček v CZK
        const cumulativeLoanCzk = monthActiveLoans.reduce((sum, loan) => sum + (loan.loanAmountCzk || 0), 0);
        // Hodnota portfolia v CZK
        const cumulativeCzk = (cumulativeCollateral + cumulativeBtc) * validBtcPrice - cumulativeLoanCzk;
        collateralValues.push(parseFloat(cumulativeCollateral.toFixed(3)));
        btcValues.push(parseFloat(cumulativeBtc.toFixed(3)));
        czkValues.push(Math.round(cumulativeCzk));
      }
      
      const chartData: ChartData = {
        labels,
        btcValues,
        collateralValues,
        czkValues
      };
      
      setStatisticsSummary(summary);
      setChartData(chartData);
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      const message = error instanceof Error ? error.message : 'Failed to load statistics data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);
  
  return {
    statisticsSummary,
    chartData,
    isLoading,
    error,
    refreshStatistics: loadStatistics
  };
};
