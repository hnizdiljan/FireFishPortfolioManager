// Centrální export všech typů pro lepší organizaci
import type { components, paths, operations } from '../api-types';

export type { components, paths, operations };

// Re-export hlavních entit z API
export type LoanDto = components["schemas"]["LoanDto"];
export type Loan = components["schemas"]["Loan"];
export type LoanInput = Omit<components["schemas"]["Loan"], 
  'id' | 'user' | 'sellOrders' | 'createdAt' | 'updatedAt'
> & {
  userId?: string; // userId is optional for new loans
};

export type UserDto = components["schemas"]["UserDto"];
export type User = components["schemas"]["User"];

export type SellOrder = components["schemas"]["SellOrder"];
export type SellOrderAggDto = components["schemas"]["SellOrderAggDto"];
export type SellOrderBasicDto = components["schemas"]["SellOrderBasicDto"];

// Enums
export type LoanStatus = components["schemas"]["LoanStatus"];
export type SellOrderStatus = components["schemas"]["SellOrderStatus"];
export type ExitStrategyType = components["schemas"]["ExitStrategyType"];
export type DistributionType = components["schemas"]["DistributionType"];

// Exit Strategy typy
export type ExitStrategyBase = components["schemas"]["ExitStrategyBase"];
export type HodlExitStrategy = components["schemas"]["HodlExitStrategy"];
export type CustomLadderExitStrategy = components["schemas"]["CustomLadderExitStrategy"];
export type CustomLadderOrder = components["schemas"]["CustomLadderOrder"];
export type SmartDistributionExitStrategy = components["schemas"]["SmartDistributionExitStrategy"];
export type EquidistantLadderExitStrategy = components["schemas"]["EquidistantLadderExitStrategy"];
export type EquifrequentLadderExitStrategy = components["schemas"]["EquifrequentLadderExitStrategy"];

// API modely
export type UserSettingsUpdateModel = components["schemas"]["UserSettingsUpdateModel"];
export type CoinmateCredentialsModel = components["schemas"]["CoinmateCredentialsModel"];
export type BtcPriceModel = components["schemas"]["BtcPriceModel"];
export type BtcAthModel = components["schemas"]["BtcAthModel"];
export type LoanReferenceDto = components["schemas"]["LoanReferenceDto"];

// Union typy pro exit strategie
export type ExitStrategy = HodlExitStrategy | CustomLadderExitStrategy | SmartDistributionExitStrategy | EquidistantLadderExitStrategy | EquifrequentLadderExitStrategy;

// Utility typy
export type GetAccessTokenFunction = () => Promise<string | null>;

// Custom typy specifické pro frontend (které nejsou v API)
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

export interface UserSettings extends UserSettingsUpdateModel {
  name?: string;
  email?: string;
  hasApiCredentials?: boolean;
}

// Statistiky (frontend specifické)
export interface ChartData {
  labels: string[];
  btcValues: number[];
  collateralValues: number[];
  czkValues: number[];
}

export interface StatisticsSummary {
  totalLoans: number;
  activeLoansCzk: number;
  totalBtcPurchased: number;
  totalBtcRemaining: number;
  totalProfitCzk: number;
  averageProfitPercentage: number;
}

// Auth store typy
export interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserDto | null;
  getAccessToken: () => Promise<string | null>;
  setAuth: (profile: UserDto) => void;
  clearAuth: () => void;
  login: () => void;
  logout: () => void;
}
