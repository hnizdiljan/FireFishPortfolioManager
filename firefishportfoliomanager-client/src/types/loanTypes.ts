import { SellStrategy } from './strategyTypes';

// Enum corresponding to LoanStatus in backend
export enum LoanStatus {
  PendingBtcTransfer = 0,
  WaitingForFiat = 1,
  PendingBtcPurchase = 2,
  Active = 3,
  PartiallyRepaid = 4,
  Repaid = 5,
  Overdue = 6
}

// Enum corresponding to SellOrderStatus in backend
export enum SellOrderStatus {
  Planned = 0,
  Submitted = 1,
  PartiallyFilled = 2,
  Completed = 3,
  Cancelled = 4,
  Failed = 5
}

export interface SellOrder {
  id: number;
  loanId: number;
  coinmateOrderId: string;
  btcAmount: number;
  pricePerBtc: number;
  totalCzk: number;
  status: SellOrderStatus;
  createdAt: string; // Use string for dates
  completedAt?: string | null;
}

export interface Loan {
  id: number;
  userId: string;
  loanId: string; // Fire Fish Loan ID
  loanDate: string; // Use string for dates
  repaymentDate: string; // Use string for dates
  status: LoanStatus;
  loanAmountCzk: number;
  interestRate: number;
  repaymentAmountCzk: number;
  feesBtc: number;
  transactionFeesBtc: number;
  collateralBtc: number;
  totalSentBtc: number;
  purchasedBtc: number;
  currentBtcPrice: number;
  repaymentWithFeesBtc: number;
  targetProfitPercentage: number;
  maxSellOrders: number;
  minSellOrderSize: number;
  totalTargetProfitPercentage: number;
  withdrawalWalletAddress: string;
  createdAt: string; // Use string for dates
  updatedAt: string; // Use string for dates
  sellOrders: SellOrder[];
}

// Input type for creating/updating loans (adjust based on API expectations)
export type LoanInput = Omit<Loan, 'id' | 'currentBtcPrice' | 'repaymentWithFeesBtc' | 'createdAt' | 'updatedAt' | 'sellOrders' | 'userId'> & Partial<Pick<Loan, 'userId'>>; 