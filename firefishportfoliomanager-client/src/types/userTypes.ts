export interface UserDto {
  id: string; // Azure AD ObjectId
  name: string;
  email: string;
  allocatedBtc: number;
  targetLtv: number;
  maxLoanAmount: number; 
  createdAt: string; // Use string for dates transferred via JSON
  lastLoginAt?: string | null; // Use string for dates transferred via JSON
  drawdownFromAth: number;
  absoluteLiquidationPrice: number;
  ltvPercent: number;
}

export interface UserSettingsUpdateModel {
  allocatedBtc: number;
  drawdownFromAth: number;
  absoluteLiquidationPrice: number;
  ltvPercent: number;
}

export interface BtcPriceModel {
  priceCzk: number;
} 