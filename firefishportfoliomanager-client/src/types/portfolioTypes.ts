// Make sure this file is treated as a module
export {};

import type { components } from '../api-types';

/**
 * Types for portfolio data
 */

export type Loan = components["schemas"]["LoanDto"];
export type LoanStatus = components["schemas"]["LoanStatus"];

export interface PortfolioSummary {
  allocatedBtc: number;
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

/**
 * Typ pro nastavení uživatele
 */
export type UserSettings = components["schemas"]["UserSettingsUpdateModel"] & {
  name?: string;
  email?: string;
  hasApiCredentials?: boolean;
};
