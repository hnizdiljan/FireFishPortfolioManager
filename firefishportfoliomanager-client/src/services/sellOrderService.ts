import { callApi } from './apiService';
import { GetAccessTokenFunction } from '../types';
import { components } from '../api-types';

type SellOrderAggDto = components['schemas']['SellOrderAggDto'];
type SellOrderBasicDto = components['schemas']['SellOrderBasicDto'];
type SellOrderStatus = components['schemas']['SellOrderStatus'];

/**
 * Service pro správu sell orderů
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na sell orders
 */

/**
 * Získá všechny sell ordery pro aktuálního uživatele
 */
export const fetchAllSellOrders = async (
  getAccessToken: GetAccessTokenFunction,
  status?: SellOrderStatus | null,
  sortBy?: string | null,
  sortDir: string = 'asc'
): Promise<SellOrderAggDto[]> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortDir) params.append('sortDir', sortDir);

  const queryString = params.toString();
  const url = `/api/sellorders/all${queryString ? `?${queryString}` : ''}`;
  
  return callApi<SellOrderAggDto[]>(url, getAccessToken);
};

/**
 * Získá sell ordery pro konkrétní půjčku
 */
export const fetchSellOrdersForLoan = async (
  getAccessToken: GetAccessTokenFunction,
  loanId: number
): Promise<SellOrderBasicDto[]> => {
  return callApi<SellOrderBasicDto[]>(`/api/sellorders/loan/${loanId}`, getAccessToken);
};

/**
 * Otevře sell order na Coinmate
 */
export const openSellOrder = async (
  getAccessToken: GetAccessTokenFunction,
  orderId: number
): Promise<void> => {
  await callApi<null>(`/api/sellorders/${orderId}/open`, getAccessToken, {
    method: 'POST',
  });
};

/**
 * Zruší sell order na Coinmate
 */
export const cancelSellOrder = async (
  getAccessToken: GetAccessTokenFunction,
  orderId: number
): Promise<void> => {
  await callApi<null>(`/api/sellorders/${orderId}/cancel`, getAccessToken, {
    method: 'POST',
  });
};

/**
 * Synchronizuje sell ordery s Coinmate
 */
export const syncSellOrders = async (
  getAccessToken: GetAccessTokenFunction
): Promise<void> => {
  await callApi<null>('/api/sellorders/sync', getAccessToken, {
    method: 'POST',
  });
}; 