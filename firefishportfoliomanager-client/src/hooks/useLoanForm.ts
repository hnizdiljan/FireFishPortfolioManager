import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoanStatus, LoanInput } from '../types/loanTypes';
import { fetchLoanById, createLoan, updateLoan } from '../services/loanService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { fetchCurrentUser } from '../services/userService';

// Initial state for a new loan
const initialLoanState: LoanInput = {
  loanId: '',
  loanDate: new Date().toISOString().split('T')[0],
  loanPeriodMonths: 6,
  repaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], 
  status: LoanStatus.Active,
  loanAmountCzk: 0,
  interestRate: 7, // Default to 7%
  fireFishFeePercent: 1.5, // This field will be hidden from the UI but kept for backward compatibility
  repaymentAmountCzk: 0,
  feesBtc: 0,
  transactionFeesBtc: 0.0001,
  collateralBtc: 0,
  totalSentBtc: 0,
  purchasedBtc: 0,
  totalTargetProfitPercentage: 50,
  bitcoinProfitRatio: 50
};

export const useLoanForm = (loanId?: number) => {
  const [loanData, setLoanData] = useState<LoanInput>(initialLoanState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isEditing = Boolean(loanId);
  const isUpdatingRef = useRef(false);
  const prevLoanPeriodRef = useRef<number>(initialLoanState.loanPeriodMonths);

  // Calculate derived values whenever relevant inputs change
  useEffect(() => {
    // Skip if we're already updating to prevent recursion
    if (isUpdatingRef.current) return;
    if (Object.keys(loanData).length === 0) return;

    // Create a copy of current data to update
    let updatedData = { ...loanData };
    let hasUpdates = false;
    
    // Track if loan period has changed
    const loanPeriodChanged = prevLoanPeriodRef.current !== loanData.loanPeriodMonths;
    prevLoanPeriodRef.current = loanData.loanPeriodMonths;

    // 1. Calculate repayment date from loan date and period
    let newRepaymentDate = loanData.repaymentDate;
    if (loanData.loanDate && loanData.loanPeriodMonths) {
      try {
        const loanDate = new Date(loanData.loanDate);
        if (!isNaN(loanDate.getTime())) {
          // Create a new date by making a proper copy of loan date
          const repaymentDate = new Date(loanDate);
          // Add the selected number of months
          repaymentDate.setMonth(loanDate.getMonth() + loanData.loanPeriodMonths);
          const formattedDate = repaymentDate.toISOString().split('T')[0];
          if (formattedDate !== loanData.repaymentDate) {
            updatedData.repaymentDate = formattedDate;
            newRepaymentDate = formattedDate;
            hasUpdates = true;
          }
        }
      } catch (e) {
        console.error("Error calculating repayment date:", e);
      }
    }

    // 2. Calculate repayment amount from loan amount and interest rate
    // Always use current loanDate and newRepaymentDate (which may have just been recalculated)
    if (loanData.loanAmountCzk > 0 && loanData.interestRate >= 0 && loanData.loanDate && newRepaymentDate) {
      // calculate days difference ignoring timezone offsets
      const loanDateObj = new Date(loanData.loanDate);
      const repaymentDateObj = new Date(newRepaymentDate);
      const utcLoanDate = Date.UTC(
        loanDateObj.getFullYear(),
        loanDateObj.getMonth(),
        loanDateObj.getDate()
      );
      const utcRepaymentDate = Date.UTC(
        repaymentDateObj.getFullYear(),
        repaymentDateObj.getMonth(),
        repaymentDateObj.getDate()
      );
      const days = Math.max(1, Math.floor((utcRepaymentDate - utcLoanDate) / (1000 * 60 * 60 * 24)));
      const interestFactor = 1 + ((loanData.interestRate / 100) * days / 365);
      const repayment = loanData.loanAmountCzk * interestFactor;
      
      // Force update repayment if loan period changed
      if (loanPeriodChanged || Math.abs(repayment - loanData.repaymentAmountCzk) > 0.001) {
        updatedData.repaymentAmountCzk = repayment;
        hasUpdates = true;
      }
    }

    // 3. Calculate collateral based on repayment amount and LTV settings if available
    if (loanData.repaymentAmountCzk > 0 && settings?.ltv && settings.ltv > 0 && settings.currentBtcPrice && settings.currentBtcPrice > 0) {
      // For collateral, we use repaymentAmountCzk / (ltv/100)
      // Example: repayment 100k CZK with LTV 50% = 200k CZK in collateral value
      const collateralCzk = loanData.repaymentAmountCzk / (settings.ltv / 100);
      // Convert to BTC using current price
      const collateralBtc = collateralCzk / settings.currentBtcPrice;
      
      if (Math.abs(collateralBtc - loanData.collateralBtc) > 0.00000001) {
        updatedData.collateralBtc = collateralBtc;
        hasUpdates = true;
      }
    }

    // 4. Calculate total BTC sent (collateral + fees + transaction fees)
    const totalSent = updatedData.collateralBtc + updatedData.feesBtc + updatedData.transactionFeesBtc;
    if (Math.abs(totalSent - loanData.totalSentBtc) > 0.00000001) {
      updatedData.totalSentBtc = totalSent;
      hasUpdates = true;
    }

    // Only update state if there were actual changes to avoid infinite loops
    if (hasUpdates) {
      isUpdatingRef.current = true;
      setLoanData(updatedData);
      // Reset flag after update
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [
    loanData,
    settings
  ]);

  // Fetch existing loan data if in edit mode
  useEffect(() => {
    if (isEditing && loanId) {
      const loadLoan = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = await getAccessToken();
          if (!token) {
            throw new Error('No authentication token available');
          }
          
          const existingLoan = await fetchLoanById(() => Promise.resolve(token), loanId);
          setLoanData({
            loanId: existingLoan.loanId || '',
            loanDate: existingLoan.loanDate || new Date().toISOString().split('T')[0],
            loanPeriodMonths: existingLoan.loanPeriodMonths || 6,
            repaymentDate: existingLoan.repaymentDate || new Date().toISOString().split('T')[0],
            status: existingLoan.status,
            loanAmountCzk: existingLoan.loanAmountCzk || 0,
            interestRate: existingLoan.interestRate || 0,
            fireFishFeePercent: existingLoan.fireFishFeePercent || 1.5,
            repaymentAmountCzk: existingLoan.repaymentAmountCzk || 0,
            feesBtc: existingLoan.feesBtc || 0,
            transactionFeesBtc: existingLoan.transactionFeesBtc || 0,
            collateralBtc: existingLoan.collateralBtc || 0,
            totalSentBtc: existingLoan.totalSentBtc || 0,
            purchasedBtc: existingLoan.purchasedBtc || 0,
            totalTargetProfitPercentage: existingLoan.totalTargetProfitPercentage || 0,
            bitcoinProfitRatio: existingLoan.bitcoinProfitRatio || 50
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
    }
  }, [loanId, isEditing, getAccessToken]);

  const updateField = useCallback((field: keyof LoanInput, value: any) => {
    setLoanData(prevData => ({
      ...prevData,
      [field]: value
    }));
  }, []);

  const saveLoan = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const tokenFn = () => Promise.resolve(token);
      let loanToSave = { ...loanData };
      // Pokud není userId, načti aktuálního uživatele a nastav userId
      if (!loanToSave.userId) {
        const user = await fetchCurrentUser(tokenFn);
        loanToSave.userId = user.id;
      }
      // Zaokrouhli BTC hodnoty na 8 desetinných míst
      const btcFields: (keyof LoanInput)[] = [
        'collateralBtc',
        'feesBtc',
        'transactionFeesBtc',
        'totalSentBtc',
        'purchasedBtc',
      ];
      btcFields.forEach(field => {
        if (typeof loanToSave[field] === 'number') {
          (loanToSave as any)[field] = Number((loanToSave[field] as number).toFixed(8));
        }
      });
      if (isEditing && loanId) {
        await updateLoan(tokenFn, loanId, loanToSave);
      } else {
        await createLoan(tokenFn, loanToSave);
      }
      navigate('/loans'); // Navigate back to the loans list
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save loan';
      setError(message);
      console.error('Error saving loan:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, loanId, loanData, getAccessToken, navigate]);

  return {
    loanData,
    isLoading,
    isSaving,
    error,
    isEditing,
    updateField,
    saveLoan
  };
}; 