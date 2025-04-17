import { PortfolioSummary } from '../types/portfolioTypes';
import { Loan, LoanStatus } from '../types/loanTypes';
import { callApi } from './apiService';

// Define the type for the function that gets the token
type GetAccessTokenFunction = () => Promise<string | null>;

/**
 * Factory function to create a portfolio service instance.
 * @param getAccessToken Function to retrieve the access token for API authorization.
 */
export const createPortfolioService = (getAccessToken: GetAccessTokenFunction) => {
  
  /**
   * Fetches portfolio summary from the API by combining data from user and loans endpoints
   * @returns Promise with PortfolioSummary data
   */
  const fetchPortfolioSummary = async (): Promise<PortfolioSummary> => {
    try {      // Fetch user data and BTC price in parallel
      const [userData, loansData, btcPriceData] = await Promise.all([
        callApi<any>('/api/User', getAccessToken),
        callApi<Loan[]>('/api/Loans', getAccessToken),
        callApi<any>('/api/User/btc-price', getAccessToken)
      ]);

    // Count active loans and get their total amount
    const activeLoans = loansData.filter((loan: Loan) => 
      loan.status === LoanStatus.Active
    );
    
    const activeLoanCount = activeLoans.length;
    const totalLoanAmountCzk = activeLoans.reduce((sum: number, loan: Loan) => 
      sum + (loan.loanAmountCzk || 0), 0
    );
    
    // Calculate total purchased BTC
    const totalPurchasedBtc = loansData.reduce((sum: number, loan: Loan) => 
      sum + (loan.purchasedBtc || 0), 0
    );
    
    // Find nearest repayment (loan with closest repayment date)
    let nearestRepayment = null;
    if (activeLoans.length > 0) {
      const today = new Date();
      const sortedByDate = [...activeLoans].sort((a, b) => 
        new Date(a.repaymentDate).getTime() - new Date(b.repaymentDate).getTime()
      );
      
      const nearest = sortedByDate[0];
      const repayDate = new Date(nearest.repaymentDate);
      const daysRemaining = Math.ceil((repayDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      nearestRepayment = {
        loanId: nearest.id,
        daysRemaining,
        amountCzk: nearest.repaymentAmountCzk
      };
    }
    
    // Calculate simple profit - this is simplified and should be replaced with 
    // proper calculation from your business logic
    const currentBtcValue = totalPurchasedBtc * btcPriceData.priceCzk;
    const totalInvested = totalLoanAmountCzk;
    const profit = currentBtcValue - totalInvested;
    
    const portfolioSummary: PortfolioSummary = {
      allocatedBtc: userData.allocatedBtc,
      targetLtv: userData.targetLtv,
      maxLoanAmount: userData.maxLoanAmount,
      activeLoanCount,
      totalLoanAmountCzk,
      totalPurchasedBtc,
      currentBtcPriceCzk: btcPriceData.priceCzk,
      profit,
      nearestRepayment,
      ltvPercent: userData.ltvPercent,
    };
    
    return portfolioSummary;
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    throw error;
  }
};

  /**
   * Fetches all loans from the API
   * @returns Promise with array of Loan objects
   */
  const fetchLoans = async (): Promise<Loan[]> => {
    try {
      return await callApi<Loan[]>('/api/Loans', getAccessToken);
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  };

  /**
   * Fetches a single loan by ID from the API
   * @param id The loan ID to fetch
   * @returns Promise with Loan object
   */  const fetchLoanById = async (id: number): Promise<Loan> => {
    try {
      return await callApi<Loan>(`/api/Loans/${id}`, getAccessToken);
    } catch (error) {
      console.error(`Error fetching loan ${id}:`, error);
      throw error;
    }
  };
  
  return {
    fetchPortfolioSummary,
    fetchLoans,
    fetchLoanById
  };
};

// Pro zpětnou kompatibilitu - postupně přejít na používání hooku usePortfolioService
export const fetchLoans = async (): Promise<Loan[]> => {
  // Tato funkce bude používat API volání s autentizačním tokenem
  // V produkčním režimu by se volala jako hook uvnitř komponent
  console.warn('Deprecated: Use usePortfolioService().fetchLoans() instead');
  throw new Error('Not implemented. Use usePortfolioService().fetchLoans() within a React component');
};
