import { useEffect, useState } from 'react';
import { useAuthStore, AuthState } from '@store/authStore';
import { fetchExitStrategy as fetchExitStrategyService } from '../services/exitStrategyService';
import { ExitStrategy } from '../types';

export type ExitStrategyType = 'HODL' | 'CustomLadder' | 'SmartDistribution' | string;

export const useExitStrategy = (loanId?: number) => {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  const [strategy, setStrategy] = useState<ExitStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loanId) return;
    setIsLoading(true);
    setError(null);
    fetchExitStrategyService(getAccessToken, loanId)
      .then(data => {
        if (!data) {
          setStrategy(null);

          return;
        }
        // Keep the original format from the API - no normalization needed
        setStrategy(data);
      })
      .catch(err => setError(err.message || 'Chyba při načítání strategie'))
      .finally(() => setIsLoading(false));
  }, [loanId, getAccessToken]);

  return { strategy, isLoading, error };
}; 