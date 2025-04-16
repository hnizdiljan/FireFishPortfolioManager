import { callApi } from "./apiService";
import { UserDto, UserSettingsUpdateModel, BtcPriceModel } from "../types/userTypes";

// Typ pro funkci, která umí získat token
type GetAccessTokenFunction = () => Promise<string | null>;

// Base URL for API calls - not used for CoinGecko
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7227';

/**
 * Fetch current user data
 * @param getAccessToken Function to retrieve the access token
 * @returns UserDto object
 */
export const fetchCurrentUser = async (getAccessToken: GetAccessTokenFunction): Promise<UserDto> => {
  return callApi<UserDto>('/api/User', getAccessToken);
};

/**
 * Get current BTC price in CZK from internal API (might be cached or specific to user)
 * @param getAccessToken Function to retrieve the access token (required for authenticated endpoints)
 * @returns Object with BTC price
 */
export const fetchInternalBtcPrice = async (getAccessToken: GetAccessTokenFunction): Promise<BtcPriceModel> => {
  // Renamed from fetchBtcPrice
  return callApi<BtcPriceModel>('/api/User/btc-price', getAccessToken);
};

/**
 * Update user settings
 * @param getAccessToken Function to retrieve the access token
 * @param settings The settings to update (allocatedBtc, targetLtv)
 * @returns Updated UserDto object
 */
export const updateUserSettings = async (getAccessToken: GetAccessTokenFunction, settings: UserSettingsUpdateModel): Promise<UserDto> => {
  return callApi<UserDto>('/api/User/settings', getAccessToken, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};

/**
 * Update Coinmate credentials for the user
 * @param getAccessToken Function to retrieve the access token
 * @param credentials API Key and Secret
 */
export const updateCoinmateCredentials = async (getAccessToken: GetAccessTokenFunction, credentials: { apiKey: string; apiSecret: string }): Promise<void> => {
  // Backend returns NoContent (204)
  await callApi<null>('/api/User/coinmate-credentials', getAccessToken, {
    method: 'PUT',
    body: JSON.stringify(credentials),
  });
};

/**
 * Fetch ATH BTC price from backend
 * @param getAccessToken Function to retrieve the access token (required for authenticated endpoints)
 * @returns Object with ATH BTC price
 */
export const fetchBtcAth = async (getAccessToken: GetAccessTokenFunction): Promise<{ athCzk: number }> => {
  return callApi<{ athCzk: number }>('/api/market/btc-ath', getAccessToken);
};
