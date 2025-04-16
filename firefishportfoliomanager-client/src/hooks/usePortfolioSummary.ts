import { useDashboardData } from './useDashboardData';
import { LoanStatus /*, Loan */ } from '../types/loanTypes'; // Loan removed
import { PortfolioSummary } from '../types/portfolioTypes'; // Keep this import
import { useMemo } from 'react';
// Removed unused imports: useState, useEffect, useCallback, getPortfolioSummary
// import { useState, useEffect, useCallback } from 'react';
// import { getPortfolioSummary } from '../services/apiService';

// Interface for the data needed by child components, matching PortfolioSummary structure
// Note: We might not need to return the *exact* PortfolioSummary type if 
// child components are flexible, but it's good practice if possible.

export const usePortfolioSummary = (): PortfolioSummary | null => {
  const { dashboardData } = useDashboardData();
  const { user, loans, btcPrice } = dashboardData;

  // Use useMemo to calculate the summary only when underlying data changes
  const portfolioSummary = useMemo((): PortfolioSummary | null => {
    if (!user || !loans || btcPrice === null || btcPrice === undefined) {
      return null; // Not enough data to calculate summary
    }

    // Use Repaid status for filtering active loans
    const activeLoans = loans.filter(l => l.status !== LoanStatus.Repaid);
    const totalLoanAmountCzk = activeLoans.reduce((sum, loan) => sum + (loan.loanAmountCzk || 0), 0);
    // Assuming totalPurchasedBtc should consider *all* loans, not just active
    const totalPurchasedBtc = loans.reduce((sum, loan) => sum + (loan.purchasedBtc || 0), 0); 

    const nextRepaymentLoan = activeLoans.length > 0 
      ? activeLoans.reduce((earliest, current) => 
          new Date(current.repaymentDate) < new Date(earliest.repaymentDate) ? current : earliest
        )
      : null;
      
    const nearestRepayment = nextRepaymentLoan ? {
        loanId: nextRepaymentLoan.id,
        // Calculate days remaining safely
        daysRemaining: Math.ceil((new Date(nextRepaymentLoan.repaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
        amountCzk: nextRepaymentLoan.repaymentAmountCzk
    } : null;
    
    // Simple profit calculation - needs review based on actual business logic
    // This calculation might be flawed. Does it account for repaid loans? Interest?
    // For now, replicating the logic previously in Dashboard, using total purchased BTC
    const currentTotalBtcValue = totalPurchasedBtc * btcPrice;
    const totalInvestedCzk = loans.reduce((sum, loan) => sum + (loan.loanAmountCzk || 0), 0); // Sum of all initial loan amounts
    const estimatedProfit = currentTotalBtcValue - totalInvestedCzk; // Very basic estimation

    return {
      // User specific data
      allocatedBtc: user.allocatedBtc,
      targetLtv: user.targetLtv,
      maxLoanAmount: user.maxLoanAmount,
      // Calculated loan data
      activeLoanCount: activeLoans.length,
      totalLoanAmountCzk,
      totalPurchasedBtc,
      currentBtcPriceCzk: btcPrice, // Use the fetched price
      profit: estimatedProfit, // Use the calculated profit
      nearestRepayment,
      ltvPercent: user.ltvPercent ?? 0,
    };
  }, [user, loans, btcPrice]); // Dependencies for recalculation

  return portfolioSummary;
}; 