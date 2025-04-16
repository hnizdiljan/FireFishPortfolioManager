import { useState, useEffect, useCallback } from 'react';
import { Loan } from '../types/loanTypes';
import { fetchLoans, deleteLoan as apiDeleteLoan } from '../services/loanService';
import { useAuth } from '../context/AuthContext';

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

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