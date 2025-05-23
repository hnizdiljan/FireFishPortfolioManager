import dayjs from 'dayjs';

export interface LoanCalculationParams {
  loanAmount: number;
  interestRate: number;
  loanDate: string | Date;
  loanPeriodMonths: number;
}

export interface LoanSummary {
  loanAmount: number;
  repaymentAmount: number;
  interestAmount: number;
  collateral: number;
  totalSent: number;
  purchased: number;
  effectiveBtc: number;
  currentBtcValue: number;
}

export interface BitcoinCalculations {
  collateral: number;
  fees: number;
  transactionFees: number;
  totalSent: number;
  purchased: number;
  effectiveBtc: number;
}

/**
 * Vypočítá datum splacení na základě data půjčky a doby splatnosti
 */
export const calculateRepaymentDate = (loanDate: string | Date, loanPeriodMonths: number): string => {
  const loan = dayjs(loanDate);
  const repayment = loan.add(loanPeriodMonths, 'month');

  return repayment.format('YYYY-MM-DD');
};

/**
 * Vypočítá částku k splacení včetně úroků
 */
export const calculateRepaymentAmount = (params: LoanCalculationParams): number => {
  const { loanAmount, interestRate, loanDate, loanPeriodMonths } = params;
  
  if (!loanAmount || !interestRate || !loanDate || !loanPeriodMonths) {
    return 0;
  }

  // Jednoduché úročení pro krátké období (standardní pro FireFish)
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalInterest = loanAmount * monthlyInterestRate * loanPeriodMonths;
  
  return Math.round(loanAmount + totalInterest);
};

/**
 * Vypočítá kolaterál v BTC na základě LTV a ceny BTC
 */
export const calculateCollateral = (
  repaymentAmountCzk: number, 
  ltvPercent: number, 
  btcPriceCzk: number
): number => {
  if (!repaymentAmountCzk || !ltvPercent || !btcPriceCzk) {
    return 0;
  }

  const requiredCollateralCzk = repaymentAmountCzk / (ltvPercent / 100);
  const collateralBtc = requiredCollateralCzk / btcPriceCzk;
  
  return Number(collateralBtc.toFixed(8));
};

/**
 * Vypočítá celkové Bitcoin transakce
 */
export const calculateBitcoinTransactions = (
  collateralBtc: number,
  feesBtc: number,
  transactionFeesBtc: number,
  purchasedBtc: number
): BitcoinCalculations => {
  const totalSent = collateralBtc + feesBtc + transactionFeesBtc;
  const effectiveBtc = purchasedBtc - feesBtc - transactionFeesBtc;
  
  return {
    collateral: Number(collateralBtc.toFixed(8)),
    fees: Number(feesBtc.toFixed(8)),
    transactionFees: Number(transactionFeesBtc.toFixed(8)),
    totalSent: Number(totalSent.toFixed(8)),
    purchased: Number(purchasedBtc.toFixed(8)),
    effectiveBtc: Number(effectiveBtc.toFixed(8)),
  };
};

/**
 * Vypočítá kompletní souhrn půjčky
 */
export const calculateLoanSummary = (
  loanData: {
    loanAmountCzk?: number;
    repaymentAmountCzk?: number;
    collateralBtc?: number;
    feesBtc?: number;
    transactionFeesBtc?: number;
    purchasedBtc?: number;
  },
  btcPrice: number = 0
): LoanSummary => {
  const loanAmount = loanData.loanAmountCzk || 0;
  const repaymentAmount = loanData.repaymentAmountCzk || 0;
  const interestAmount = repaymentAmount - loanAmount;
  
  const bitcoinCalc = calculateBitcoinTransactions(
    loanData.collateralBtc || 0,
    loanData.feesBtc || 0,
    loanData.transactionFeesBtc || 0,
    loanData.purchasedBtc || 0
  );
  
  return {
    loanAmount,
    repaymentAmount,
    interestAmount,
    collateral: bitcoinCalc.collateral,
    totalSent: bitcoinCalc.totalSent,
    purchased: bitcoinCalc.purchased,
    effectiveBtc: bitcoinCalc.effectiveBtc,
    currentBtcValue: bitcoinCalc.effectiveBtc * btcPrice,
  };
};

/**
 * Validuje krok formuláře
 */
export const validateFormStep = (step: number, formData: Record<string, unknown>): string[] => {
  const errors: string[] = [];
  
  switch (step) {
    case 0: // Základní údaje
      if (!formData.loanId) errors.push('ID půjčky je povinné');
      if (!formData.status) errors.push('Status je povinný');
      if (!formData.loanDate) errors.push('Datum půjčky je povinné');
      if (!formData.loanPeriodMonths) errors.push('Doba splatnosti je povinná');
      break;
      
    case 1: { // Finanční detaily
      const loanAmount = Number(formData.loanAmountCzk);
      const interestRate = Number(formData.interestRate);
      
      if (!loanAmount || loanAmount <= 0) {
        errors.push('Částka půjčky musí být větší než 0');
      }
      if (isNaN(interestRate) || interestRate < 0) {
        errors.push('Úroková sazba musí být nezáporná');
      }
      break;
    }
      
    case 2: { // Bitcoin transakce
      const feesBtc = Number(formData.feesBtc);
      const transactionFeesBtc = Number(formData.transactionFeesBtc);
      const collateralBtc = Number(formData.collateralBtc);
      const purchasedBtc = Number(formData.purchasedBtc);
      
      if (isNaN(feesBtc) || feesBtc < 0) {
        errors.push('FireFish poplatky nemohou být záporné');
      }
      if (isNaN(transactionFeesBtc) || transactionFeesBtc < 0) {
        errors.push('Transakční poplatky nemohou být záporné');
      }
      if (isNaN(collateralBtc) || collateralBtc <= 0) {
        errors.push('Kolaterál musí být větší než 0');
      }
      if (isNaN(purchasedBtc) || purchasedBtc <= 0) {
        errors.push('Nakoupené BTC musí být větší než 0');
      }
      break;
    }
  }
  
  return errors;
};

/**
 * Formátuje číslo pro zobrazení s tisícovými oddělovači
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formátuje BTC hodnotu s odpovídajícím počtem desetinných míst
 */
export const formatBtc = (amount: number, decimals: number = 8): string => {
  return Number(amount.toFixed(decimals)).toString();
}; 