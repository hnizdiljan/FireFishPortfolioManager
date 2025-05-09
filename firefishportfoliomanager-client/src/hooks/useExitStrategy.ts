import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchExitStrategy as fetchExitStrategyService } from '../services/exitStrategyService';

export type ExitStrategyType = 'HODL' | 'CustomLadder' | 'SmartDistribution' | string;

export const useExitStrategy = (loanId?: number) => {
  const { getAccessToken } = useAuth();
  const [strategy, setStrategy] = useState<any>(null);
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
        // Normalize type key
        const type = (data as any).type || (data as any).Type;
        setStrategy(type ? { ...data, type } : data);
      })
      .catch(err => setError(err.message || 'Chyba při načítání strategie'))
      .finally(() => setIsLoading(false));
  }, [loanId, getAccessToken]);

  return { strategy, isLoading, error };
}; 