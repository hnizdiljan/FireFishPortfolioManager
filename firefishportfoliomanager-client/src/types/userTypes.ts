import type { components } from '../api-types';

export type UserDto = components["schemas"]["UserDto"];
export type UserSettingsUpdateModel = components["schemas"]["UserSettingsUpdateModel"];
export type BtcPriceModel = components["schemas"]["BtcPriceModel"];

// Typ pro funkci, která umí získat token
export type GetAccessTokenFunction = () => Promise<string | null>; 