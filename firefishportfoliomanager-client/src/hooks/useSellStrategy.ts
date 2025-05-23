import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loan } from '../types/loanTypes';
import { 
    fetchLoanById, 
    executeSellStrategy as apiExecuteStrategy 
} from '../services/loanService';
import { useAuthStore, AuthState } from '@store/authStore';

export const useSellStrategy = (loanId?: number) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
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
      const loanData = await fetchLoanById(getAccessToken, loanId);
      setLoan(loanData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load loan';
      setError(message);
      console.error(`Error loading data for loan ${loanId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [loanId, getAccessToken]);

  const executeStrategy = useCallback(async () => {
    if (!loanId) {
      console.warn('Execution prevented: Invalid ID.');

      return false;
    }
    setIsExecuting(true);
    setError(null);
    try {
      const executedOrders = await apiExecuteStrategy(getAccessToken, loanId);
      alert(`Successfully submitted ${executedOrders.length} sell orders!`);
      navigate('/loans');

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute strategy';
      setError(message);
      console.error(`Error executing strategy for loan ${loanId}:`, err);

      return false;
    } finally {
      setIsExecuting(false);
    }
  }, [loanId, getAccessToken, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loan,
    isLoading,
    isExecuting,
    error,
    refreshData: loadData,
    executeStrategy,
  };
}; 