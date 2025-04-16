// Make sure this file is treated as a module
export {};

/**
 * Types for portfolio data
 */

export interface PortfolioSummary {
  allocatedBtc: number;
  targetLtv: number;
  maxLoanAmount: number;
  activeLoanCount: number;
  totalLoanAmountCzk: number;
  totalPurchasedBtc: number;
  currentBtcPriceCzk: number;
  profit?: number;
  nearestRepayment: {
    loanId: number;
    daysRemaining: number;
    amountCzk: number;
  } | null;
  ltvPercent: number;
}

export interface Loan {
  id: number;
  loanId: string;
  loanDate: string;         // Doplnění alias pro borrowDate
  borrowDate: string;
  repaymentDate: string;
  status: LoanStatus;
  loanAmountCzk: number;    // Doplnění alias pro amountCzk
  amountCzk: number;
  interestRate: number;
  repaymentAmountCzk: number;
  ffFeesBtc: number;
  transactionFeesBtc: number;
  collateralBtc: number;
  totalSentBtc: number;
  purchasedBtc: number;     // Doplnění alias pro btcPurchased
  btcPurchased: number;
  currentBtcPrice?: number; // Přidání volitelné vlastnosti pro cenu BTC
}

export enum LoanStatus {
  Active = 'Active',                   // Oprava na velká písmena pro shodu s kódem v komponentách
  PendingFiat = 'WaitingForFiat',      // Přizpůsobení názvům v UI komponentách
  PendingBtcPurchase = 'PendingBtcPurchase',
  PendingBtcCollateral = 'PendingBtcTransfer',
  PartiallyRepaid = 'PartiallyRepaid', // Přidání dalšího stavu
  Completed = 'Repaid',                // Přizpůsobení názvům v UI komponentách
  Defaulted = 'Overdue',               // Přizpůsobení názvům v UI komponentách
}

/**
 * Typ pro nastavení uživatele
 */
export interface UserSettings {
  name: string;
  email: string;
  allocatedBtc: number;
  targetLtv: number;
  maxLoanAmount: number;
  hasApiCredentials: boolean;
}
