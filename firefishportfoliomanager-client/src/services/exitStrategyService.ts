import { callApi } from './apiService';
import { GetAccessTokenFunction } from '../types/userTypes';

export type ExitStrategyApiResponse = { Type: string; Orders?: any[]; TargetProfitPercent?: number; OrderCount?: number; BtcProfitRatioPercent?: number };

export async function fetchExitStrategy(getAccessToken: GetAccessTokenFunction, loanId: number): Promise<ExitStrategyApiResponse | null> {
  return callApi<ExitStrategyApiResponse | null>(`/api/loans/${loanId}/exitstrategy`, getAccessToken, { method: 'GET' });
}

export async function saveExitStrategy(getAccessToken: GetAccessTokenFunction, loanId: number, strategy: any): Promise<void> {
  await callApi<null>(`/api/loans/${loanId}/exitstrategy`, getAccessToken, {
    method: 'PUT',
    body: JSON.stringify(strategy),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function openSellOrder(getAccessToken: GetAccessTokenFunction, orderId: number) {
  return callApi(`/api/loans/sellorders/${orderId}/open`, getAccessToken, { method: 'POST' });
}

export async function cancelSellOrder(getAccessToken: GetAccessTokenFunction, orderId: number) {
  return callApi(`/api/loans/sellorders/${orderId}/cancel`, getAccessToken, { method: 'POST' });
}

export async function syncSellOrders(getAccessToken: GetAccessTokenFunction) {
  return callApi(`/api/loans/sellorders/sync`, getAccessToken, { method: 'POST' });
} 