import type { components } from '../api-types';

export type Loan = components["schemas"]["LoanDto"];
export type SellOrder = components["schemas"]["SellOrder"];
export type LoanStatus = components["schemas"]["LoanStatus"];
export type SellOrderStatus = components["schemas"]["SellOrderStatus"];

// Input type for creating/updating loans (adjust based on API expectations)
export type LoanInput = Omit<components["schemas"]["Loan"],
  'id' | 'createdAt' | 'updatedAt' | 'sellOrders' | 'userId' | 'user' | 'strategyJson' | 'fireFishFeePercent' | 'totalTargetProfitPercentage' | 'bitcoinProfitRatio' | 'currentBtcPrice' | 'repaymentWithFeesBtc'
> & Partial<Pick<components["schemas"]["Loan"], 'userId'>>; 