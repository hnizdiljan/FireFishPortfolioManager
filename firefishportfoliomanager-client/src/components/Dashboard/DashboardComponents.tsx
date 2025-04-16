import React from 'react';
import { Link } from 'react-router-dom';
import { PortfolioSummary } from '../../types/portfolioTypes';

// Make sure this file is treated as a module
export {};

interface UpcomingRepaymentProps {
  nearestRepayment: NonNullable<PortfolioSummary['nearestRepayment']>;
}

export const UpcomingRepayment: React.FC<UpcomingRepaymentProps> = ({ nearestRepayment }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
    <h2 className="text-lg font-bold text-yellow-800 mb-2">Upcoming Repayment</h2>
    <p className="text-yellow-700">
      Loan #{nearestRepayment.loanId} is due in {nearestRepayment.daysRemaining} days.
      <span className="font-bold"> Amount due: {nearestRepayment.amountCzk.toLocaleString()} CZK</span>
    </p>
    <Link to={`/loans/${nearestRepayment.loanId}`} className="mt-2 inline-block text-yellow-700 font-medium underline">
      View Loan Details
    </Link>
  </div>
);

interface RecentLoansProps {
  loans?: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

export const RecentLoans: React.FC<RecentLoansProps> = ({ loans = [] }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <h2 className="text-xl font-bold mb-4">Recent Loans</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loans.map(loan => (
            <tr key={loan.id}>
              <td className="py-3 px-3 text-sm font-medium">{loan.id}</td>
              <td className="py-3 px-3 text-sm text-gray-500">{loan.date}</td>
              <td className="py-3 px-3 text-sm text-gray-500">{loan.amount.toLocaleString()} CZK</td>
              <td className="py-3 px-3 text-sm">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {loan.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Link to="/loans" className="mt-4 inline-block text-blue-600 font-medium">
      View All Loans →
    </Link>
  </div>
);

interface PortfolioPerformanceProps {
  summary: PortfolioSummary;
}

export const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({ summary }) => {
  const currentValue = (summary.totalPurchasedBtc * summary.currentBtcPriceCzk);
  const profit = summary.profit || 0;
  const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitSign = profit >= 0 ? '+' : '';
  
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-bold mb-4">Portfolio Performance</h2>
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>Chart placeholder - portfolio performance over time</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-lg font-bold">{currentValue.toLocaleString()} CZK</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Profit</p>
          <p className={`text-lg font-bold ${profitClass}`}>
            {profitSign}{profit.toLocaleString()} CZK
          </p>
        </div>
      </div>
    </div>
  );
};
