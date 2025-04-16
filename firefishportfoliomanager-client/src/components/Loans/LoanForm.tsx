import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoanInput, LoanStatus } from '../../types/loanTypes';
import { useLoanForm } from '../../hooks/useLoanForm';

const LoanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : undefined;

  const {
    loanData,
    isLoading,
    isSaving,
    error,
    isEditing,
    updateField,
    saveLoan,
  } = useLoanForm(numericId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | LoanStatus = value;

    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'date') {
        processedValue = value;
    } else if (name === 'status') {
      processedValue = parseInt(value, 10) as LoanStatus;
    }
    
    if (name in loanData) {
       updateField(name as keyof LoanInput, processedValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveLoan();
  };

  if (isLoading && isEditing) {
    return <div className="text-center py-10">Loading loan data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Loan' : 'Add New Loan'}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 space-y-6">
        <div>
          <label htmlFor="loanId" className="block text-sm font-medium text-gray-700">Loan ID (from FireFish)</label>
          <input
            type="text"
            id="loanId"
            name="loanId"
            value={loanData.loanId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="loanDate" className="block text-sm font-medium text-gray-700">Loan Date</label>
          <input type="date" id="loanDate" name="loanDate" value={loanData.loanDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="repaymentDate" className="block text-sm font-medium text-gray-700">Repayment Date</label>
          <input type="date" id="repaymentDate" name="repaymentDate" value={loanData.repaymentDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select 
            id="status" 
            name="status" 
            value={loanData.status} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            {Object.entries(LoanStatus)
              .filter(([key]) => isNaN(Number(key)))
              .map(([key, value]) => (
                <option key={value} value={value}>{key.replace(/([A-Z])/g, ' $1').trim()}</option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="loanAmountCzk" className="block text-sm font-medium text-gray-700">Loan Amount (CZK)</label>
          <input type="number" step="any" id="loanAmountCzk" name="loanAmountCzk" value={loanData.loanAmountCzk} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
          <input type="number" step="any" id="interestRate" name="interestRate" value={loanData.interestRate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="repaymentAmountCzk" className="block text-sm font-medium text-gray-700">Repayment Amount (CZK)</label>
          <input type="number" step="any" id="repaymentAmountCzk" name="repaymentAmountCzk" value={loanData.repaymentAmountCzk} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="feesBtc" className="block text-sm font-medium text-gray-700">Fire Fish Fees (BTC)</label>
          <input type="number" step="any" id="feesBtc" name="feesBtc" value={loanData.feesBtc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="transactionFeesBtc" className="block text-sm font-medium text-gray-700">Transaction Fees (BTC)</label>
          <input type="number" step="any" id="transactionFeesBtc" name="transactionFeesBtc" value={loanData.transactionFeesBtc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="collateralBtc" className="block text-sm font-medium text-gray-700">Collateral (BTC)</label>
          <input type="number" step="any" id="collateralBtc" name="collateralBtc" value={loanData.collateralBtc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="totalSentBtc" className="block text-sm font-medium text-gray-700">Total BTC Sent</label>
          <input type="number" step="any" id="totalSentBtc" name="totalSentBtc" value={loanData.totalSentBtc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="purchasedBtc" className="block text-sm font-medium text-gray-700">Purchased BTC</label>
          <input type="number" step="any" id="purchasedBtc" name="purchasedBtc" value={loanData.purchasedBtc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="targetProfitPercentage" className="block text-sm font-medium text-gray-700">Target Profit (%)</label>
          <input type="number" step="any" id="targetProfitPercentage" name="targetProfitPercentage" value={loanData.targetProfitPercentage} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="maxSellOrders" className="block text-sm font-medium text-gray-700">Maximum Sell Orders</label>
          <input type="number" step="any" id="maxSellOrders" name="maxSellOrders" value={loanData.maxSellOrders} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="minSellOrderSize" className="block text-sm font-medium text-gray-700">Minimum Sell Order Size (BTC)</label>
          <input type="number" step="any" id="minSellOrderSize" name="minSellOrderSize" value={loanData.minSellOrderSize} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="totalTargetProfitPercentage" className="block text-sm font-medium text-gray-700">Total Target Profit (%)</label>
          <input type="number" step="any" id="totalTargetProfitPercentage" name="totalTargetProfitPercentage" value={loanData.totalTargetProfitPercentage} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div>
          <label htmlFor="withdrawalWalletAddress" className="block text-sm font-medium text-gray-700">Withdrawal Wallet Address</label>
          <input type="text" id="withdrawalWalletAddress" name="withdrawalWalletAddress" value={loanData.withdrawalWalletAddress} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/loans')} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md mr-2 transition duration-300"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Update Loan' : 'Create Loan')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
