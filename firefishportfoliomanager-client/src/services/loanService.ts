import { callApi } from "./apiService";
import { Loan, LoanInput, SellOrder } from "../types/loanTypes";
import { SellStrategy } from "../types/strategyTypes";

// Typ pro funkci, která umí získat token
type GetAccessTokenFunction = () => Promise<string | null>;

/**
 * Fetch all loans for the current user
 * @param getAccessToken Function to retrieve the access token
 */
export const fetchLoans = async (getAccessToken: GetAccessTokenFunction): Promise<Loan[]> => {
  return callApi<Loan[]>('/api/Loans', getAccessToken);
};

/**
 * Fetch a specific loan by ID
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan
 */
export const fetchLoanById = async (getAccessToken: GetAccessTokenFunction, id: number): Promise<Loan> => {
  return callApi<Loan>(`/api/Loans/${id}`, getAccessToken);
};

/**
 * Create a new loan
 * @param getAccessToken Function to retrieve the access token
 * @param loanData Data for the new loan (LoanInput type)
 */
export const createLoan = async (getAccessToken: GetAccessTokenFunction, loanData: LoanInput): Promise<Loan> => {
  return callApi<Loan>('/api/Loans', getAccessToken, {
    method: 'POST',
    body: JSON.stringify(loanData),
  });
};

/**
 * Update an existing loan
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan to update
 * @param loanData Data for the updated loan (LoanInput type)
 */
export const updateLoan = async (getAccessToken: GetAccessTokenFunction, id: number, loanData: LoanInput): Promise<void> => {
  // Backend returns NoContent (204), so expect null or void
  await callApi<null>(`/api/Loans/${id}`, getAccessToken, {
    method: 'PUT',
    body: JSON.stringify({ ...loanData, id }), // Ensure ID is included in the body for backend PUT
  });
};

/**
 * Delete a loan
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan to delete
 */
export const deleteLoan = async (getAccessToken: GetAccessTokenFunction, id: number): Promise<void> => {
  // Backend returns NoContent (204)
  await callApi<null>(`/api/Loans/${id}`, getAccessToken, { method: 'DELETE' });
};

/**
 * Generate sell strategy for a loan
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan
 */
export const generateSellStrategy = async (getAccessToken: GetAccessTokenFunction, id: number): Promise<SellStrategy> => {
  return callApi<SellStrategy>(`/api/Loans/${id}/sellstrategy`, getAccessToken, { method: 'POST' });
};

/**
 * Execute sell strategy for a loan
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan
 */
export const executeSellStrategy = async (getAccessToken: GetAccessTokenFunction, id: number): Promise<SellOrder[]> => {
  return callApi<SellOrder[]>(`/api/Loans/${id}/execute`, getAccessToken, { method: 'POST' });
};
