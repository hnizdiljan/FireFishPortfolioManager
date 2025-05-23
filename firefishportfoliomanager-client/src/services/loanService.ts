import { callApi } from "./apiService";
import { LoanDto, LoanInput, SellOrder, GetAccessTokenFunction } from "../types";

/**
 * Fetch all loans for the current user
 * @param getAccessToken Function to retrieve the access token
 */
export const fetchLoans = async (getAccessToken: GetAccessTokenFunction): Promise<LoanDto[]> => {
  return callApi<LoanDto[]>('/api/Loans', getAccessToken);
};

/**
 * Fetch a specific loan by ID
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan
 */
export const fetchLoanById = async (getAccessToken: GetAccessTokenFunction, id: number): Promise<LoanDto> => {
  return callApi<LoanDto>(`/api/Loans/${id}`, getAccessToken);
};

/**
 * Create a new loan
 * @param getAccessToken Function to retrieve the access token
 * @param loanData Data for the new loan (LoanInput type)
 */
export const createLoan = async (getAccessToken: GetAccessTokenFunction, loanData: LoanInput): Promise<LoanDto> => {
  return callApi<LoanDto>('/api/Loans', getAccessToken, {
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
 * Execute sell strategy for a loan
 * @param getAccessToken Function to retrieve the access token
 * @param id ID of the loan
 */
export const executeSellStrategy = async (getAccessToken: GetAccessTokenFunction, id: number): Promise<SellOrder[]> => {
  return callApi<SellOrder[]>(`/api/Loans/${id}/execute`, getAccessToken, { method: 'POST' });
};

/**
 * Fetch sell orders for a specific loan
 * @param getAccessToken Function to retrieve the access token
 * @param loanId ID of the loan
 */
export const fetchSellOrdersForLoan = async (getAccessToken: GetAccessTokenFunction, loanId: number) => {
  return callApi<SellOrder[]>(`/api/loans/${loanId}/sellorders`, getAccessToken);
};
