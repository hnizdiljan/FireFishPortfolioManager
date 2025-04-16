import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { Loan, LoanStatus } from '../../types/loanTypes'; // Removed unused types
import { useLoans } from '../../hooks/useLoans';
import { statusDisplay } from '../../utils/loanUtils';

const LoansPage: React.FC = () => {
  const { loans, isLoading, error, removeLoan } = useLoans();
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      await removeLoan(id);
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

      {loans.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-10">
          You haven't added any loans yet.
        </div>
      )}

      {loans.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID (FF)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (CZK)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repayment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => {
                  const displayStatus = statusDisplay[loan.status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.loanId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan.loanAmountCzk.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(loan.repaymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${displayStatus.color || 'bg-gray-100 text-gray-800'}`}>
                          {displayStatus.text}
                        </span>
                      </td>
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