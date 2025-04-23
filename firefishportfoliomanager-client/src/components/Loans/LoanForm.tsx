import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoanInput } from '../../types/loanTypes';
import { useLoanForm } from '../../hooks/useLoanForm';
import NumericInput from '../shared/NumericInput';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { fetchCurrentUser, fetchInternalBtcPrice } from '../../services/userService';

const LoanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : undefined;
  const { settings } = useSettings();
  const { getAccessToken } = useAuth();

  const {
    loanData,
    isLoading,
    isSaving,
    error,
    isEditing,
    updateField,
    saveLoan,
  } = useLoanForm(numericId ?? 0);

  // Lokální stav pro zobrazení aktuální hodnoty LTV a BTC ceny
  const [ltvPercent, setLtvPercent] = React.useState<number | null>(null);
  const [btcPrice, setBtcPrice] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchLtvAndBtc = async () => {
      const token = await getAccessToken();
      if (!token) return;
      const user = await fetchCurrentUser(() => Promise.resolve(token));
      const btcPriceData = await fetchInternalBtcPrice(() => Promise.resolve(token));
      setLtvPercent(user.ltvPercent ?? null);
      setBtcPrice(btcPriceData.priceCzk ?? null);
    };
    fetchLtvAndBtc();
  }, [getAccessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;

    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'date') {
      processedValue = value;
    } else if (name === 'status') {
      processedValue = value; // string enum
    } else if (name === 'loanPeriodMonths') {
      processedValue = parseInt(value, 10) || 0;
    }
    
    if (name in loanData) {
      updateField(name as keyof LoanInput, processedValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveLoan();
  };

  const handleRecalculateCollateral = async () => {
    const repaymentAmountCzk = loanData.repaymentAmountCzk;
    const token = await getAccessToken();
    if (!token || !repaymentAmountCzk) return;
    // Získání aktuálního uživatele a ceny BTC
    const user = await fetchCurrentUser(() => Promise.resolve(token));
    const btcPriceData = await fetchInternalBtcPrice(() => Promise.resolve(token));
    const ltv = user.ltvPercent ?? null;
    const price = btcPriceData.priceCzk ?? null;
    setLtvPercent(ltv);
    setBtcPrice(price);
    if (!ltv || !price) return;
    const requiredCollateralCzk = repaymentAmountCzk / ((ltv ?? 100) / 100);
    const collateralBtc = requiredCollateralCzk / (price ?? 1);
    updateField('collateralBtc', Number(collateralBtc.toFixed(8)));
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading loan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{isEditing ? 'Edit Loan' : 'Add New Loan'}</h1>
        <p className="text-gray-600">Enter the loan details below. Required fields are marked with an asterisk (*).</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow mb-6" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="w-6 h-6 mr-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl overflow-hidden">
        
        {/* Základní údaje o půjčce */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Basic Loan Information</h2>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="loanId" className="block text-sm font-medium text-gray-700 mb-1">
                Loan ID (from FireFish) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="loanId"
                name="loanId"
                value={loanData.loanId}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                placeholder="Enter loan ID from FireFish"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select 
                id="status" 
                name="status" 
                value={loanData.status} 
                onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Termíny půjčky */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Loan Timeline</h2>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="loanDate" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                id="loanDate" 
                name="loanDate" 
                value={loanData.loanDate} 
                onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                required 
              />
            </div>

            <div>
              <label htmlFor="loanPeriodMonths" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Period <span className="text-red-500">*</span>
              </label>
              <select
                id="loanPeriodMonths"
                name="loanPeriodMonths"
                value={loanData.loanPeriodMonths}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={18}>18 months</option>
              </select>
            </div>

            <div>
              <label htmlFor="repaymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                Repayment Date (Auto-calculated)
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  id="repaymentDate" 
                  name="repaymentDate" 
                  value={loanData.repaymentDate} 
                  readOnly 
                  className="block w-full border border-gray-200 rounded-lg shadow-sm py-3 px-4 bg-gray-50 text-gray-700 cursor-not-allowed" 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Based on loan date and selected period</p>
            </div>
          </div>
        </div>

        {/* Finanční detaily půjčky */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Financial Details</h2>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="loanAmountCzk" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (CZK) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">CZK</span>
                </div>
                <NumericInput 
                  id="loanAmountCzk" 
                  name="loanAmountCzk" 
                  value={loanData.loanAmountCzk} 
                  onChangeNumber={(num) => updateField('loanAmountCzk', num)} 
                  step="any" 
                  required 
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <NumericInput 
                  id="interestRate" 
                  name="interestRate" 
                  value={loanData.interestRate} 
                  onChangeNumber={(num) => updateField('interestRate', num)} 
                  step="any" 
                  required 
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="repaymentAmountCzk" className="block text-sm font-medium text-gray-700 mb-1">
                Repayment Amount (CZK) (Auto-calculated)
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">CZK</span>
                </div>
                <NumericInput 
                  id="repaymentAmountCzk" 
                  name="repaymentAmountCzk" 
                  value={loanData.repaymentAmountCzk} 
                  onChangeNumber={(num) => updateField('repaymentAmountCzk', num)} 
                  step="any" 
                  required 
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Loan amount + interest</p>
            </div>
          </div>
        </div>

        {/* BTC transakční detaily */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Bitcoin Transaction Details</h2>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="feesBtc" className="block text-sm font-medium text-gray-700 mb-1">
                Fire Fish Fees (BTC) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₿</span>
                </div>
                <NumericInput 
                  id="feesBtc" 
                  name="feesBtc" 
                  value={loanData.feesBtc} 
                  onChangeNumber={(num) => updateField('feesBtc', num)} 
                  step="any" 
                  required
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00000000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="transactionFeesBtc" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Fees (BTC) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₿</span>
                </div>
                <NumericInput 
                  id="transactionFeesBtc" 
                  name="transactionFeesBtc" 
                  value={loanData.transactionFeesBtc} 
                  onChangeNumber={(num) => updateField('transactionFeesBtc', num)} 
                  step="any" 
                  required 
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00000000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="collateralBtc" className="block text-sm font-medium text-gray-700 mb-1">
                Collateral (BTC)
                <span className="ml-2 text-xs text-gray-500">(Manual or <button type="button" onClick={handleRecalculateCollateral} className="underline text-blue-600 hover:text-blue-800">Recalculate</button>)</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₿</span>
                </div>
                <NumericInput 
                  id="collateralBtc" 
                  name="collateralBtc" 
                  value={loanData.collateralBtc} 
                  onChangeNumber={(num) => updateField('collateralBtc', num)} 
                  step="any" 
                  required
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00000000"
                />
              </div>
              <div className="mt-2 bg-blue-50 p-2 rounded-md flex items-start">
                <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <p className="text-xs text-gray-600">
                  You can enter manually or recalculate based on repayment amount, LTV ({ltvPercent ?? settings?.ltv ?? 70}%) and current BTC price ({btcPrice?.toLocaleString() ?? settings?.currentBtcPrice?.toLocaleString() ?? 'N/A'} CZK).
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="totalSentBtc" className="block text-sm font-medium text-gray-700 mb-1">
                Total BTC Sent (Auto-calculated)
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₿</span>
                </div>
                <NumericInput 
                  id="totalSentBtc" 
                  name="totalSentBtc" 
                  value={loanData.totalSentBtc} 
                  onChangeNumber={(num) => updateField('totalSentBtc', num)} 
                  step="any" 
                  required 
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00000000"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Collateral + Fees + Transaction Fees</p>
            </div>
          </div>
        </div>

        {/* BTC nákup a výsledky */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Bitcoin Purchase & Strategy</h2>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="purchasedBtc" className="block text-sm font-medium text-gray-700 mb-1">
                Purchased BTC <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₿</span>
                </div>
                <NumericInput 
                  id="purchasedBtc" 
                  name="purchasedBtc" 
                  value={loanData.purchasedBtc} 
                  onChangeNumber={(num) => updateField('purchasedBtc', num)} 
                  step="any" 
                  required 
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-12 pr-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                  placeholder="0.00000000"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/loans')} 
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
            >
              <svg className="h-5 w-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className={`inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {isEditing ? 'Update Loan' : 'Create Loan'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
