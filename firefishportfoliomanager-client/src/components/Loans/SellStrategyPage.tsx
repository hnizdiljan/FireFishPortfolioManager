import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { Loan, SellOrder } from '../../types/loanTypes'; // Removed unused imports
// import { SellStrategy, SellStrategyOrder } from '../../types/strategyTypes'; // Removed unused imports
import { useSellStrategy } from '../../hooks/useSellStrategy';

const SellStrategyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : undefined;

  const {
    loan,
    strategy,
    isLoading,
    isExecuting,
    error,
    // refreshData, // Removed unused variable
    executeStrategy
  } = useSellStrategy(numericId);

  const handleExecuteClick = async () => {
    if (window.confirm('Are you sure you want to execute this sell strategy and place orders on Coinmate?')) {
      await executeStrategy();
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading strategy...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  if (!loan) {
    return <div className="text-center py-10">Loan not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Sell Strategy</h1>
      <p className="text-gray-600 mb-6">Loan ID: {loan.loanId}</p>

      {strategy ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Strategy</h2>
          
          {!strategy.isViable && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
              Strategy is currently not viable (e.g., target price is lower than required for repayment or profit is negative).
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <p><strong>Current BTC Price:</strong> {strategy.currentBtcPriceCzk.toLocaleString()} CZK</p>
            <p><strong>Target Sell Price:</strong> {strategy.targetSellPriceCzk.toLocaleString()} CZK</p>
            <p><strong>BTC for Repayment:</strong> {strategy.btcToSellForRepayment.toFixed(8)} BTC</p>
            <p><strong>Estimated BTC Profit:</strong> {strategy.remainingBtcProfit.toFixed(8)} BTC</p>
          </div>

          {strategy.isViable && strategy.sellOrders.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-2">Planned Sell Orders ({strategy.sellOrders.length}):</h3>
              <div className="overflow-x-auto mb-6">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">BTC Amount</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Price (CZK/BTC)</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Total (CZK)</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {strategy.sellOrders.map((order, index) => (
                              <tr key={index}>
                                  <td className="px-4 py-2 whitespace-nowrap">{order.btcAmount.toFixed(8)}</td>
                                  <td className="px-4 py-2 whitespace-nowrap">{order.pricePerBtc.toLocaleString()}</td>
                                  <td className="px-4 py-2 whitespace-nowrap">{order.totalCzk.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => navigate(`/loans/${id}/edit`)} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-300"
                    >
                    Adjust Loan/Strategy
                  </button>
                 <button 
                    onClick={handleExecuteClick}
                    disabled={isExecuting || !strategy.isViable}
                    className={`bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ${
                      (isExecuting || !strategy.isViable) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                 >
                    {isExecuting ? 'Executing...' : 'Execute Strategy on Coinmate'}
                 </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-10">Could not generate sell strategy.</div>
      )}
    </div>
  );
};

export default SellStrategyPage;
