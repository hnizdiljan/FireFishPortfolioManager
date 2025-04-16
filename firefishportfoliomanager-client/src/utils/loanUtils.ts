import { LoanStatus } from '../types/loanTypes';

// Mapping from LoanStatus enum values to display text and optional colors
export const statusDisplay: { [key in LoanStatus]: { text: string; color?: string } } = {
  [LoanStatus.PendingBtcTransfer]: { text: 'Pending BTC Transfer', color: 'bg-yellow-100 text-yellow-800' },
  [LoanStatus.WaitingForFiat]: { text: 'Waiting For Fiat', color: 'bg-blue-100 text-blue-800' },
  [LoanStatus.PendingBtcPurchase]: { text: 'Pending BTC Purchase', color: 'bg-purple-100 text-purple-800' },
  [LoanStatus.Active]: { text: 'Active', color: 'bg-green-100 text-green-800' },
  [LoanStatus.PartiallyRepaid]: { text: 'Partially Repaid', color: 'bg-teal-100 text-teal-800' },
  [LoanStatus.Repaid]: { text: 'Repaid', color: 'bg-gray-100 text-gray-800' },
  [LoanStatus.Overdue]: { text: 'Overdue', color: 'bg-red-100 text-red-800' },
  // Add other statuses if they exist in the enum
};

// Můžeme sem přidat další pomocné funkce pro práci s půjčkami 