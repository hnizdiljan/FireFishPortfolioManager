export interface SellStrategyOrder {
  btcAmount: number;
  pricePerBtc: number;
  totalCzk: number;
}

export interface SellStrategy {
  loanId: number;
  currentBtcPriceCzk: number;
  targetSellPriceCzk: number;
  btcToSellForRepayment: number;
  remainingBtcProfit: number;
  isViable: boolean;
  sellOrders: SellStrategyOrder[];
} 