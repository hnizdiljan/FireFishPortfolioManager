import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loan } from '../types/loanTypes';
import { SellStrategy } from '../types/strategyTypes';
import { 
    fetchLoanById, 
    generateSellStrategy as apiGenerateStrategy, 
    executeSellStrategy as apiExecuteStrategy 
} from '../services/loanService';
import { useAuth } from '../context/AuthContext';

export const useSellStrategy = (loanId?: number) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [strategy, setStrategy] = useState<SellStrategy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!loanId) {
      setError('Loan ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch loan and generate strategy concurrently
      const [loanData, strategyData] = await Promise.all([
        fetchLoanById(getAccessToken, loanId),
        apiGenerateStrategy(getAccessToken, loanId)
      ]);
      setLoan(loanData);
      setStrategy(strategyData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load loan or strategy';
      setError(message);
      console.error(`Error loading data for loan ${loanId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [loanId, getAccessToken]);

  const executeStrategy = useCallback(async () => {
    if (!loanId || !strategy || !strategy.isViable) {
      console.warn('Execution prevented: Invalid ID, strategy, or strategy not viable.');
      return false; // Indicate failure
    }
    
    setIsExecuting(true);
    setError(null);
    try {
      const executedOrders = await apiExecuteStrategy(getAccessToken, loanId);
      // Potentially show a success message here (e.g., using a toast library)
      alert(`Successfully submitted ${executedOrders.length} sell orders!`); // Simple alert for now
      navigate('/loans'); // Navigate back after execution
      return true; // Indicate success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute strategy';
      setError(message);
      console.error(`Error executing strategy for loan ${loanId}:`, err);
       return false; // Indicate failure
    } finally {
      setIsExecuting(false);
    }
  }, [loanId, strategy, getAccessToken, navigate]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loan,
    strategy,
    isLoading,
    isExecuting,
    error,
    refreshData: loadData, // Function to reload loan and strategy data
    executeStrategy,
  };
}; 