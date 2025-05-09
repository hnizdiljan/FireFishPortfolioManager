import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loan } from '../../types/loanTypes';
import { fetchLoanById } from '../../services/loanService';
import { useAuth } from '../../context/AuthContext';
import ExitStrategyForm from './ExitStrategyForm';

const EditExitStrategyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLoan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!id) throw new Error('Missing loan ID');
        const numericId = parseInt(id, 10);
        const loanData = await fetchLoanById(getAccessToken, numericId);
        setLoan(loanData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load loan');
      } finally {
        setIsLoading(false);
      }
    };
    loadLoan();
  }, [id, getAccessToken]);

  if (isLoading) {
    return <div className="text-center py-10">Načítám data půjčky...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">Chyba: {error}</div>;
  }
  if (!loan) {
    return <div className="text-center py-10">Půjčka nenalezena.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Nastavit exit strategii</h1>
      <ExitStrategyForm loan={loan} onSaved={() => navigate(`/loans/${loan.id}/sell-strategy`)} />
    </div>
  );
};

export default EditExitStrategyPage; 