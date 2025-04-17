// import { SellStrategy } from './strategyTypes'; // Removed unused import

// Simplified two-state loan status
export enum LoanStatus {
  Active = 0,
  Closed = 1
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
  loanPeriodMonths: number; // Period of the loan in months (3, 6, 12, 18)
  repaymentDate: string; // Use string for dates (calculated from loanDate + loanPeriodMonths)
  status: LoanStatus;
  loanAmountCzk: number;
  interestRate: number;
  fireFishFeePercent: number; // Default 1.5% but can be overridden
  repaymentAmountCzk: number; // Calculated from loanAmount + interest
  feesBtc: number; // Fire Fish Fees in BTC
  transactionFeesBtc: number;
  collateralBtc: number; // Calculated based on LTV from settings but can be overridden
  totalSentBtc: number; // Calculated: Collateral + Transaction Fees + FF Fees
  purchasedBtc: number;
  currentBtcPrice: number;
  repaymentWithFeesBtc: number;
  totalTargetProfitPercentage: number;
  bitcoinProfitRatio: number; // New: % of profit to keep in BTC (0-100)
  createdAt: string; // Use string for dates
  updatedAt: string; // Use string for dates
  sellOrders: SellOrder[];
}

// Input type for creating/updating loans (adjust based on API expectations)
export type LoanInput = Omit<Loan, 
  'id' | 
  'currentBtcPrice' | 
  'repaymentWithFeesBtc' | 
  'createdAt' | 
  'updatedAt' | 
  'sellOrders' | 
  'userId'
> & Partial<Pick<Loan, 'userId'>>; 