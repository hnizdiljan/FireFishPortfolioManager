import { useState, useEffect, useCallback } from 'react';
import { Loan } from '../types/loanTypes';
import { ExitStrategy } from '../types';
import { fetchLoans, deleteLoan as apiDeleteLoan } from '../services/loanService';
import { fetchExitStrategy } from '../services/exitStrategyService';
import { fetchLoanById } from '../services/loanService';
import { fetchInternalBtcPrice } from '../services/userService';
import { useAuthStore, AuthState } from '@store/authStore';

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);

  const loadLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLoans(getAccessToken);
      setLoans(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load loans';
      setError(message);
      console.error('Error loading loans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const removeLoan = useCallback(async (id: number) => {
    // Note: Optimistic UI update could be implemented here for better UX
    // For simplicity, we refetch after delete, or just filter locally
    setError(null); // Clear previous errors before delete attempt
    try {
      await apiDeleteLoan(getAccessToken, id);
      setLoans(currentLoans => currentLoans.filter(loan => loan.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete loan';
      setError(message);
      console.error(`Error deleting loan ${id}:`, err);
      // Optionally re-throw or handle differently, maybe refetch loans list
      // loadLoans(); 
    }
  }, [getAccessToken]);

  // Initial load
  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  return {
    loans,
    isLoading,
    error,
    refreshLoans: loadLoans, // Provide a way to manually refresh
    removeLoan,
  };
};

export const useLoansDetails = () => {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loansDetails, setLoansDetails] = useState<(Loan & { exitStrategy: ExitStrategy | null })[]>([]);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseLoans = await fetchLoans(getAccessToken);
      setLoans(baseLoans);
      const btc = await fetchInternalBtcPrice(getAccessToken);
      setBtcPrice(btc.priceCzk ?? null);
      const details = await Promise.all(
        baseLoans.map(async (loan) => {
          const fullLoan = await fetchLoanById(getAccessToken, loan.id);
          let exitStrategy = null;
          try {
            exitStrategy = await fetchExitStrategy(getAccessToken, loan.id);
          } catch (e) {
            exitStrategy = null;
          }

          return { ...fullLoan, exitStrategy };
        })
      );
      setLoansDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání detailů půjček');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const removeLoan = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiDeleteLoan(getAccessToken, id);
      // Optimistic update - remove from local state immediately
      setLoans(currentLoans => currentLoans.filter(loan => loan.id !== id));
      setLoansDetails(currentDetails => currentDetails.filter(detail => detail.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se smazat půjčku';
      setError(message);
      console.error(`Error deleting loan ${id}:`, err);
      throw err; // Re-throw to handle in UI
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { 
    loans, 
    loansDetails, 
    btcPrice, 
    isLoading, 
    error, 
    refreshLoans: loadData,
    removeLoan
  };
}; 