import { useEffect, useState } from 'react';

export const useBtcPrice = () => {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/User/btc-price');
        if (!response.ok) throw new Error('Chyba při načítání ceny BTC');
        const data = await response.json();
        setBtcPrice(data.price ?? null);
      } catch (err: any) {
        setError(err.message || 'Chyba při načítání ceny BTC');
        setBtcPrice(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrice();
  }, []);

  return { btcPrice, isLoading, error };
}; 