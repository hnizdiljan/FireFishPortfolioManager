import React from 'react';
import { PortfolioSummaryRow } from './PortfolioSummaryComponents';
import { UpcomingRepayment, RecentLoans } from './DashboardComponents';
import ErrorBoundary from '../shared/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { statusDisplay } from '../../utils/loanUtils';
import { usePortfolioSummary } from '../../hooks/usePortfolioSummary';
import type { Loan } from '../../types/loanTypes';

// Make sure this file is treated as a module
export {};

// Define and export the Dashboard component
const Dashboard: React.FC = () => {
  const { dashboardData, isLoading, error } = useDashboardData();
  const { user, loans, btcPrice } = dashboardData;
  const { userName } = useAuth();
  
  // Use the portfolio summary hook
  const portfolioSummary = usePortfolioSummary();

  // Filter to only show active loans
  const activeLoans = loans.filter(l => l.status !== 'Closed');
  const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmountCzk, 0);
  const totalRepaymentAmount = activeLoans.reduce((sum, loan) => sum + loan.repaymentAmountCzk, 0);
  const totalCollateralBtc = activeLoans.reduce((sum, loan) => sum + loan.collateralBtc, 0);
  const totalPurchasedBtc = activeLoans.reduce((sum, loan) => sum + (loan.purchasedBtc ?? 0), 0);
  const collateralValue = btcPrice ? totalCollateralBtc * btcPrice : 0;
  const purchasedValue = btcPrice ? totalPurchasedBtc * btcPrice : 0;
  const nextRepayment = activeLoans.length > 0 
    ? activeLoans.reduce((earliest, current) => 
        new Date(current.repaymentDate) < new Date(earliest.repaymentDate) ? current : earliest
      )
    : null;

  // Calculate recentLoansSummary here as it's specific to this component's view
  const recentLoansSummary = [...loans].sort((a, b) => 
      new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime()
    ).slice(0, 3).map((loan: Loan) => ({
      id: loan.loanId || `ID-${String(loan.id)}`,
      date: new Date(loan.loanDate).toISOString().split('T')[0],
      amount: loan.loanAmountCzk, 
      status: statusDisplay[loan.status]?.text || 'Unknown'
    }));
    
  if (isLoading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="mb-8 text-lg text-gray-600">Welcome back, {userName || user?.name || 'User'}!</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {portfolioSummary && (
          <>
            <PortfolioSummaryRow summary={portfolioSummary} />
            
            {portfolioSummary.nearestRepayment && (
              <UpcomingRepayment nearestRepayment={portfolioSummary.nearestRepayment} />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 sm:gap-y-8 md:gap-y-12 lg:gap-y-16 mb-8">
              <RecentLoans loans={recentLoansSummary} />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Active Loaned</div>
            <div className="text-3xl font-bold">{totalLoanAmount.toLocaleString()} CZK</div>
            <div className="text-sm text-gray-500 mt-1">({activeLoans.length} active loans)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Repayment Due (Active)</div>
            <div className="text-3xl font-bold">{totalRepaymentAmount.toLocaleString()} CZK</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Next Repayment Due</div>
            {nextRepayment ? (
              <>
               <div className="text-3xl font-bold">{new Date(nextRepayment.repaymentDate).toLocaleDateString()}</div>
               <div className="text-sm text-gray-500 mt-1">({nextRepayment.loanId} - {nextRepayment.repaymentAmountCzk.toLocaleString()} CZK)</div>
              </>
            ) : (
              <div className="text-xl text-gray-500">N/A</div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Collateral (Active)</div>
            <div className="text-3xl font-bold">{totalCollateralBtc.toFixed(4)} BTC</div>
            <div className="text-sm text-gray-500 mt-1">≈ {collateralValue.toLocaleString()} CZK</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Purchased (Active Loans)</div>
            <div className="text-3xl font-bold">{totalPurchasedBtc.toFixed(4)} BTC</div>
            <div className="text-sm text-gray-500 mt-1">≈ {purchasedValue.toLocaleString()} CZK</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Current BTC Price</div>
            <div className="text-3xl font-bold">{btcPrice ? btcPrice.toLocaleString() : 'N/A'} CZK</div>
          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
