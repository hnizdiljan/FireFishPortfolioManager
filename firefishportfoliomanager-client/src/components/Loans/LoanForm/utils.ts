import { FormInstance } from 'antd';
import { LoanInput } from '@/types/loanTypes';
import { LoanSummary } from './types';

/**
 * Validuje konkrétní krok formuláře
 */
export const validateFormStep = (step: number, formValues: any): string[] => {
  const errors: string[] = [];

  switch (step) {
    case 0: // Základní údaje
      if (!formValues.loanId) errors.push('ID půjčky je povinné');
      if (!formValues.loanDate) errors.push('Datum půjčky je povinné');
      if (!formValues.loanPeriodMonths) errors.push('Doba splatnosti je povinná');
      break;
    case 1: // Finanční detaily
      if (!formValues.loanAmountCzk) errors.push('Částka půjčky je povinná');
      if (!formValues.interestRate) errors.push('Úroková sazba je povinná');
      break;
    case 2: // Bitcoin transakce
      if (!formValues.collateralBtc) errors.push('Kolaterál BTC je povinný');
      if (!formValues.purchasedBtc) errors.push('Nakoupené BTC je povinné');
      break;
  }

  return errors;
};

/**
 * Vypočítá souhrnné údaje půjčky
 */
export const calculateLoanSummary = (loanData: LoanInput, btcPrice: number): LoanSummary => {
  const loanAmount = loanData.loanAmountCzk || 0;
  const repaymentAmount = loanData.repaymentAmountCzk || 0;
  const interestAmount = repaymentAmount - loanAmount;
  
  const totalSent = (loanData.collateralBtc || 0) + (loanData.feesBtc || 0) + (loanData.transactionFeesBtc || 0);
  const purchased = loanData.purchasedBtc || 0;
  const effectiveBtc = purchased - (loanData.feesBtc || 0) - (loanData.transactionFeesBtc || 0);
  const currentBtcValue = effectiveBtc * btcPrice;

  return {
    loanAmount,
    interestAmount,
    repaymentAmount,
    totalSent,
    purchased,
    effectiveBtc,
    currentBtcValue,
  };
};

/**
 * Vypočítá kolaterál v BTC na základě LTV a ceny
 */
export const calculateCollateral = (repaymentAmount: number, ltvPercent: number, btcPrice: number): number => {
  if (!repaymentAmount || !ltvPercent || !btcPrice) return 0;
  
  const collateralValueCzk = repaymentAmount / (ltvPercent / 100);
  return Number((collateralValueCzk / btcPrice).toFixed(8));
};

/**
 * Validuje aktuální krok pomocí Ant Design validace
 */
export const validateCurrentStepFields = async (currentStep: number, form: FormInstance): Promise<boolean> => {
  try {
    switch (currentStep) {
      case 0:
        await form.validateFields(['loanId', 'status', 'loanDate', 'loanPeriodMonths']);
        break;
      case 1:
        await form.validateFields(['loanAmountCzk', 'interestRate']);
        break;
      case 2:
        await form.validateFields(['feesBtc', 'transactionFeesBtc', 'collateralBtc', 'purchasedBtc']);
        break;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Formátuje měnu
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formátuje BTC
 */
export const formatBtc = (amount: number): string => {
  return amount.toFixed(8);
}; 