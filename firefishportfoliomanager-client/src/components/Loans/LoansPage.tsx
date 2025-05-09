import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { Loan, LoanStatus } from '../../types/loanTypes'; // Removed unused types
import { useLoansDetails } from '../../hooks/useLoans';
import { statusDisplay } from '../../utils/loanUtils';

const getDaysLeft = (repaymentDate: string) => {
  const today = new Date();
  const repay = new Date(repaymentDate);
  return Math.ceil((repay.getTime() - today.getTime()) / (1000 * 3600 * 24));
};

const formatValueProfit = (value: number, profit: number) => {
  const profitColor = profit < 0 ? 'text-red-600' : profit > 0 ? 'text-green-600' : 'text-gray-700';
  return (
    <span className="flex flex-col">
      <span>{`CZK ${value.toLocaleString()}`}</span>
      <span className={`text-xs font-semibold ${profitColor}`}>{profit > 0 ? '+' : ''}{profit.toFixed(2)}%</span>
    </span>
  );
};

const LoansPage: React.FC = () => {
  const { loansDetails, btcPrice, isLoading, error } = useLoansDetails();
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      // removeLoan(id); // TODO: implement if needed
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading loans...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Loans</h1>
        <Link 
          to="/loans/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Add New Loan
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {loansDetails.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-10">
          You haven't added any loans yet.
        </div>
      )}

      {loansDetails.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID (FF)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (CZK)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repayment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value / Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential Value / Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Strategy</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loansDetails.map((loan: any) => {
                  // Repayment days left
                  const daysLeft = getDaysLeft(loan.repaymentDate);
                  // Realized (completed) sell orders
                  const sellOrders = loan.sellOrders || [];
                  const realized = sellOrders.filter((o: any) => o.status === 'Completed');
                  const realizedBtc = realized.reduce((sum: number, o: any) => sum + (o.btcAmount || 0), 0);
                  const realizedCzk = realized.reduce((sum: number, o: any) => sum + ((o.btcAmount || 0) * (o.pricePerBtc || 0)), 0);
                  // Nakoupené BTC
                  const boughtBtc = (loan.purchasedBtc || 0) - (loan.feesBtc || 0) - (loan.transactionFeesBtc || 0);
                  // Current Value
                  const currentValue = ((boughtBtc - realizedBtc) * (btcPrice || 0)) + realizedCzk;
                  const currentProfit = loan.repaymentAmountCzk ? ((currentValue / loan.repaymentAmountCzk) - 1) * 100 : 0;
                  // Potential Value - USE THE NEW BACKEND FIELD
                  // The backend now calculates the sum of TotalCzk for planned/submitted/partiallyfilled orders.
                  const backendPotentialValueCzk = loan.potentialValueCzk || 0; // Use the new field
                  // The "Profit" for potential value should be based on this backendPotentialValueCzk
                  // relative to the repayment amount. This assumes backendPotentialValueCzk is the total expected CZK from strategy execution.
                  // If the strategy doesn't sell all BTC, this profit calculation might be interpreted differently.
                  // For simplicity, let's calculate profit based on this value directly.
                  const potentialProfit = loan.repaymentAmountCzk && loan.repaymentAmountCzk > 0 
                                      ? ((backendPotentialValueCzk / loan.repaymentAmountCzk) - 1) * 100 
                                      : 0;
                  // Exit strategy
                  let exitStrategyContent = (
                    <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">Ještě nic nastaveno</span>
                  );
                  if (loan.exitStrategy && loan.exitStrategy.type) {
                    const type = loan.exitStrategy.type;
                    let badgeColor = 'bg-blue-100 text-blue-800';
                    if (type === 'CustomLadder') badgeColor = 'bg-green-100 text-green-800';
                    if (type === 'SmartDistribution') badgeColor = 'bg-purple-100 text-purple-800';
                    if (type === 'HODL') badgeColor = 'bg-yellow-100 text-yellow-800';
                    let countBadge = null;
                    if (loan.exitStrategy.orders || loan.exitStrategy.orderCount) {
                      const total = loan.exitStrategy.orders ? loan.exitStrategy.orders.length : loan.exitStrategy.orderCount;
                      // Realizované ordery (jen pokud jsou orders)
                      let realized = 0;
                      if (loan.exitStrategy.orders) {
                        realized = loan.exitStrategy.orders.filter((o: any) => o.status === 'Completed').length;
                      }
                      countBadge = (
                        <span className="ml-2 inline-block bg-gray-300 text-gray-800 text-[10px] px-2 py-0.5 rounded-full align-middle">{realized} / {total}</span>
                      );
                    }
                    exitStrategyContent = (
                      <span className="flex items-center gap-1">
                        <span className={`inline-block ${badgeColor} text-xs px-2 py-1 rounded-full font-semibold`}>{type}</span>
                        {countBadge}
                      </span>
                    );
                  }
                  // Status
                  const statusKey = loan.status as 'Active' | 'Closed';
                  const displayStatus = statusDisplay[statusKey] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.loanId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span>{loan.loanAmountCzk.toLocaleString()} CZK</span>
                        <br />
                        <span className="text-xs text-gray-400">k splacení: {loan.repaymentAmountCzk.toLocaleString()} CZK</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(loan.repaymentDate).toLocaleDateString()} <span className="text-xs text-gray-400">({daysLeft} dní)</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${displayStatus.color || 'bg-gray-100 text-gray-800'}`}>{displayStatus.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatValueProfit(currentValue, currentProfit)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatValueProfit(backendPotentialValueCzk, potentialProfit)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exitStrategyContent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => navigate(`/loans/${loan.id}/edit`)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => navigate(`/loans/${loan.id}/sell-strategy`)} className="text-green-600 hover:text-green-900">Strategy</button>
                        <button onClick={() => handleDelete(loan.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;