import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoanInput, LoanStatus /*, Loan */ } from '../types/loanTypes';
import { fetchLoanById, createLoan as apiCreateLoan, updateLoan as apiUpdateLoan } from '../services/loanService';
import { useAuth } from '../context/AuthContext';
import { UserDto } from '../types/userTypes';
import { fetchCurrentUser } from '../services/userService';

const initialLoanState: LoanInput = {
  loanId: '',
  loanDate: new Date().toISOString().split('T')[0],
  repaymentDate: new Date().toISOString().split('T')[0],
  status: LoanStatus.PendingBtcTransfer,
  loanAmountCzk: 0,
  interestRate: 0,
  repaymentAmountCzk: 0,
  feesBtc: 0,
  transactionFeesBtc: 0,
  collateralBtc: 0,
  totalSentBtc: 0,
  purchasedBtc: 0,
  targetProfitPercentage: 0,
  maxSellOrders: 1,
  minSellOrderSize: 0.01,
  totalTargetProfitPercentage: 0,
  withdrawalWalletAddress: ''
};

export const useLoanForm = (loanId?: number) => {
  const [loanData, setLoanData] = useState<LoanInput>(initialLoanState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken, userName } = useAuth();
  const navigate = useNavigate();
  const isEditing = Boolean(loanId);

  // Fetch existing loan data if in edit mode
  useEffect(() => {
    if (isEditing && loanId) {
      const loadLoan = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const existingLoan = await fetchLoanById(getAccessToken, loanId);
          // Map Loan to LoanInput, handling potential aliases and date formatting
          setLoanData({
            loanId: existingLoan.loanId,
            loanDate: existingLoan.loanDate?.split('T')[0] || initialLoanState.loanDate,
            repaymentDate: existingLoan.repaymentDate?.split('T')[0] || initialLoanState.repaymentDate,
            status: existingLoan.status,
            loanAmountCzk: existingLoan.loanAmountCzk || 0,
            interestRate: existingLoan.interestRate || 0,
            repaymentAmountCzk: existingLoan.repaymentAmountCzk || 0,
            feesBtc: existingLoan.feesBtc || 0, // TODO: Check alias in Loan type (ffFeesBtc?)
            transactionFeesBtc: existingLoan.transactionFeesBtc || 0,
            collateralBtc: existingLoan.collateralBtc || 0,
            totalSentBtc: existingLoan.totalSentBtc || 0,
            purchasedBtc: existingLoan.purchasedBtc || 0,
            targetProfitPercentage: existingLoan.targetProfitPercentage || 0,
            maxSellOrders: existingLoan.maxSellOrders || 1,
            minSellOrderSize: existingLoan.minSellOrderSize || 0.01,
            totalTargetProfitPercentage: existingLoan.totalTargetProfitPercentage || 0,
            withdrawalWalletAddress: existingLoan.withdrawalWalletAddress || ''
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load loan data';
          setError(message);
          console.error(`Error loading loan ${loanId}:`, err);
        } finally {
          setIsLoading(false);
        }
      };
      loadLoan();
    } else {
        // Reset to initial state if not editing or ID changes to undefined
        setLoanData(initialLoanState);
    }
  }, [loanId, isEditing, getAccessToken]);

  const updateField = useCallback((field: keyof LoanInput, value: string | number | LoanStatus) => {
    // Optional: Add validation logic here
    setLoanData(prevData => ({
      ...prevData,
      [field]: value
    }));
  }, []);

  const saveLoan = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      let finalLoanData = { ...loanData };
      // Pokusíme se získat userId z access tokenu (pokud je v claims), jinak použijeme userName jako fallback
      const accessToken = await getAccessToken();
      let userId = undefined;
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          userId = payload.oid || payload.sub || payload.userId || payload.preferred_username || undefined;
        } catch (e) {
          // ignore, fallback níže
        }
      }
      if (!userId && userName) {
        userId = userName;
      }
      if (userId) {
        finalLoanData = { ...finalLoanData, userId };
      }
      if (isEditing && loanId) {
        await apiUpdateLoan(getAccessToken, loanId, finalLoanData);
      } else {
        await apiCreateLoan(getAccessToken, finalLoanData);
      }
      navigate('/loans'); // Navigate back to the list after successful save
      return true; // Indicate success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save loan';
      setError(message);
      console.error('Error saving loan:', err);
      return false; // Indicate failure
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, loanId, loanData, getAccessToken, navigate, userName]);

  return {
    loanData,
    setLoanData, // Expose setter if direct manipulation is needed (e.g., reset)
    isLoading,
    isSaving,
    error,
    isEditing,
    updateField,
    saveLoan
  };
}; 