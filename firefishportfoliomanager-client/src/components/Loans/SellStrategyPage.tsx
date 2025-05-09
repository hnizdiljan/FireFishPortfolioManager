import React from 'react';
import { useParams } from 'react-router-dom';
import { useSellStrategy } from '../../hooks/useSellStrategy';
import LoanDetailOrders from './LoanDetailOrders';
import ExitStrategyForm from './ExitStrategyForm';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useExitStrategy } from '../../hooks/useExitStrategy';
import { TextField } from '@mui/material';
import type { Loan, SellOrder } from '../../types/loanTypes';

const SellStrategyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? parseInt(id, 10) : undefined;

  const {
    loan,
    isLoading,
    isExecuting,
    error,
    refreshData,
    executeStrategy
  } = useSellStrategy(numericId);

  const { dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData();
  const btcPrice = dashboardData.btcPrice;

  const [simulatedBtcPriceForRemaining, setSimulatedBtcPriceForRemaining] = React.useState<string>('');

  const { strategy: exitStrategy, isLoading: isStrategyLoading, error: strategyError } = useExitStrategy(numericId);

  React.useEffect(() => {
    if (loan) { 
        let defaultSimulatedPrice = '0'; 
        const currentLoanTyped = loan as (Loan & { sellOrders?: SellOrder[] });

        if (currentLoanTyped.sellOrders && currentLoanTyped.sellOrders.length > 0) {
            const plannedOrders = currentLoanTyped.sellOrders.filter(
                (o: SellOrder) => o.status === 'Planned' || o.status === 'Submitted' || o.status === 'PartiallyFilled'
            );
            if (plannedOrders.length > 0) {
                const maxPrice = Math.max(...plannedOrders.map((o: SellOrder) => o.pricePerBtc || 0));
                if (maxPrice > 0) {
                    defaultSimulatedPrice = maxPrice.toString();
                }
            }
        }
        
        // If btcPrice (current market price) is available and no valid price was found from orders, use btcPrice.
        // Or, if user prefers to always start with current market price if higher, this logic can be adjusted.
        // Current logic: Order price first, then market price if order price is 0 or not found.
        if (parseFloat(defaultSimulatedPrice) <= 0 && btcPrice) {
             defaultSimulatedPrice = btcPrice.toString();
        }

        setSimulatedBtcPriceForRemaining(defaultSimulatedPrice);
    }
  }, [btcPrice, loan]);

  // Moved calculations before early returns to satisfy rules of hooks
  const czkFromPlannedSellOrdersOnly = React.useMemo(() => {
    if (!loan || loan.potentialValueCzk === undefined || loan.remainingBtcAfterStrategy === undefined || loan.remainingBtcAfterStrategy <= 0.00000001) {
        return loan?.potentialValueCzk ?? 0; // If no remaining BTC, backend value is final
    }
    // Estimate the price backend used for its valuation of remainingBtcAfterStrategy
    let backendValuationPriceForRemainingBtc = 0;
    const currentLoanTyped = loan as (Loan & { sellOrders?: SellOrder[] });
    if (currentLoanTyped.sellOrders && currentLoanTyped.sellOrders.length > 0) {
        const plannedOrders = currentLoanTyped.sellOrders.filter(
            (o: SellOrder) => o.status === 'Planned' || o.status === 'Submitted' || o.status === 'PartiallyFilled'
        );
        if (plannedOrders.length > 0) {
            backendValuationPriceForRemainingBtc = Math.max(...plannedOrders.map((o: SellOrder) => o.pricePerBtc || 0));
        }
    }
    
    // If backend likely didn't value remaining BTC (e.g., no orders to derive price from, or BtcProfitRatioPercent was 0),
    // then loan.potentialValueCzk is already just from sell orders.
    // Or if backendValuationPrice is 0, it means no valid price from orders was found.
    if (backendValuationPriceForRemainingBtc <= 0) {
        // This implies loan.potentialValueCzk from backend does not include a valuation for remainingBtc, or that valuation was based on a zero price.
        // So, the value from sell orders is loan.potentialValueCzk itself.
        return loan.potentialValueCzk ?? 0; 
    }

    const valueOfRemainingBtcAsCalculatedOnBackend = loan.remainingBtcAfterStrategy * backendValuationPriceForRemainingBtc;
    // Subtract the backend's valuation of remaining BTC to get the value purely from sell orders
    return (loan.potentialValueCzk ?? 0) - valueOfRemainingBtcAsCalculatedOnBackend;
  }, [loan]);

  const userSimulatedBtcPriceNum = parseFloat(simulatedBtcPriceForRemaining) || 0;
  const valueOfRemainingBtcUserSimulated = (loan?.remainingBtcAfterStrategy ?? 0) * userSimulatedBtcPriceNum;
  // This is the new "Potenciální hodnota strategie" that will be displayed and used for profit calculation
  const dynamicallyCalculatedPotentialValue = czkFromPlannedSellOrdersOnly + valueOfRemainingBtcUserSimulated;

  // Potenciální hodnota strategie (dynamicky počítaná na frontendu)
  let potentialProfitPercentCalculated: number | null = null;
  if (loan?.repaymentAmountCzk && loan.repaymentAmountCzk > 0 && dynamicallyCalculatedPotentialValue !== undefined) {
    potentialProfitPercentCalculated = ((dynamicallyCalculatedPotentialValue - loan.repaymentAmountCzk) / loan.repaymentAmountCzk) * 100;
  }

  // Výpočet aktuální hodnoty
  const btcAfterFees = loan?.purchasedBtc !== undefined
    ? loan.purchasedBtc - (loan.feesBtc ?? 0) - (loan.transactionFeesBtc ?? 0)
    : 0;
  const currentSellOrders = (loan as (Loan & { sellOrders?: SellOrder[] }))?.sellOrders ?? [] as SellOrder[];
  const completedOrders = currentSellOrders.filter((o: SellOrder) => o.status === 'Completed');
  const soldBtc = completedOrders.reduce((sum: number, o: SellOrder) => sum + (o.btcAmount ?? 0), 0);
  const soldValueCzk = completedOrders.reduce((sum: number, o: SellOrder) => sum + ((o.btcAmount ?? 0) * (o.pricePerBtc ?? 0)), 0);
  const btcLeft = btcAfterFees - soldBtc;
  const currentValue = btcPrice && btcLeft >= 0 && loan
    ? (btcLeft * btcPrice) + soldValueCzk
    : null;

  // Výpočet procentuálního profitu pro aktuální hodnotu
  let currentProfitPercent: number | null = null;
  if (loan?.repaymentAmountCzk && loan.repaymentAmountCzk > 0 && currentValue !== null) {
    currentProfitPercent = ((currentValue - loan.repaymentAmountCzk) / loan.repaymentAmountCzk) * 100;
  }

  const handleExecuteClick = async () => {
    if (window.confirm('Opravdu chcete provést tuto strategii a zadat příkazy na Coinmate?')) {
      await executeStrategy();
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Načítám strategii...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Chyba: {error}</div>;
  }

  if (!loan) {
    return <div className="text-center py-10">Půjčka nenalezena.</div>;
  }

  const getProfitColor = (profit: number | null) => {
    if (profit === null) return 'text-gray-500';
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col gap-8">
      <h1 className="text-3xl font-bold mb-2">Sell Strategy</h1>
      <p className="text-gray-600 mb-6">Loan ID: {loan.loanId}</p>

      {/* Přehled půjčky a strategie */}
      <section className="bg-white shadow rounded-lg p-6 flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
          <span className="w-6 h-6 text-blue-500">&#8593;</span> Přehled půjčky a strategie
        </h2>
        <div className="mb-2">
          <span className="font-semibold">Aktuální strategie: </span>
          {isStrategyLoading && (
            <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-500 font-medium">Načítám...</span>
          )}
          {strategyError && (
            <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-medium">Chyba: {strategyError}</span>
          )}
          {!isStrategyLoading && !strategyError && (
            <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
              {exitStrategy?.type ?? 'Není k dispozici'}
            </span>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="font-medium pr-4">ID Půjčky (FF)</td>
              <td>{loan.loanId}</td>
            </tr>
            <tr>
              <td className="font-medium pr-4">Datum půjčky</td>
              <td>{new Date(loan.loanDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="font-medium pr-4">Částka půjčky</td>
              <td>{loan.loanAmountCzk?.toLocaleString()} CZK</td>
            </tr>
            <tr>
              <td className="font-medium pr-4">Částka k splacení</td>
              <td>{loan.repaymentAmountCzk?.toLocaleString()} CZK</td>
            </tr>
            <tr>
              <td className="font-medium pr-4">Množství BTC nakoupeno</td>
              <td>
                <div className="flex flex-col">
                  <span>Před poplatky: <span className="font-mono">{loan.purchasedBtc !== undefined ? loan.purchasedBtc.toFixed(8) : 'N/A'} BTC</span></span>
                  <span>Po poplatcích: <span className="font-mono">{
                    loan.purchasedBtc !== undefined
                      ? (loan.purchasedBtc - (loan.feesBtc ?? 0) - (loan.transactionFeesBtc ?? 0)).toFixed(8)
                      : 'N/A'
                  } BTC</span></span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="font-medium pr-4">Aktuální hodnota</td>
              <td>
                {isDashboardLoading && 'Načítám...'}
                {dashboardError && <span className="text-red-600">Chyba: {dashboardError}</span>}
                {!isDashboardLoading && !dashboardError && currentValue !== null && (
                  <span className="font-mono">
                    {currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} CZK
                    {currentProfitPercent !== null && (
                      <span className={`ml-2 font-semibold ${getProfitColor(currentProfitPercent)}`}>({currentProfitPercent.toFixed(2)} %)</span>
                    )}
                    {currentProfitPercent === null && (
                      <span className="ml-2 text-gray-500">(N/A)</span>
                    )}
                  </span>
                )}
                {!isDashboardLoading && !dashboardError && currentValue === null && 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="font-medium pr-4">Potenciální hodnota strategie</td>
              <td>
                {typeof dynamicallyCalculatedPotentialValue === 'number'
                  ? `${dynamicallyCalculatedPotentialValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} CZK`
                  : 'N/A'}
                {potentialProfitPercentCalculated !== null && (
                    <span className={`ml-2 font-semibold ${getProfitColor(potentialProfitPercentCalculated)}`}>({potentialProfitPercentCalculated.toFixed(2)} %)</span>
                )}
              </td>
            </tr>
            {loan.remainingBtcAfterStrategy !== undefined && loan.remainingBtcAfterStrategy > 0.00000001 && (
              <>
                <tr>
                  <td className="font-medium pr-4">BTC zbývající po strategii</td>
                  <td>
                    <span className="font-mono">{(loan.remainingBtcAfterStrategy).toFixed(8)} BTC</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium pr-4">Vaše simulovaná cena pro zbylé BTC</td>
                  <td>
                    <TextField 
                        type="number"
                        size="small"
                        variant="outlined"
                        value={simulatedBtcPriceForRemaining}
                        onChange={(e) => setSimulatedBtcPriceForRemaining(e.target.value)}
                        InputProps={{
                            endAdornment: <span style={{ marginLeft: '5px' }}>CZK/BTC</span>,
                        }}
                        sx={{ maxWidth: '200px' }}
                    />
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      {/* Exit strategie */}
      <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
        <span className="w-6 h-6 text-blue-500">&#9881;</span> Nastavení Exit Strategie
      </h2>
      <ExitStrategyForm loan={loan} onSaved={refreshData} />

      {/* Sell ordery */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
          <span className="w-6 h-6 text-blue-500">&#9776;</span> Sell ordery k půjčce
        </h2>
        <LoanDetailOrders loan={{
          ...loan,
          userId: (loan as any).userId ?? '',
          sellOrders: currentSellOrders,
          purchasedBtc: loan.purchasedBtc ?? 0,
        }} refresh={refreshData} />
      </section>

      {/* Akce */}
      <div className="flex justify-end">
        <button
          onClick={handleExecuteClick}
          disabled={isExecuting}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="w-6 h-6">&#9654;</span> {isExecuting ? 'Provádím...' : 'Execute Strategy on Coinmate'}
        </button>
      </div>
    </div>
  );
};

export default SellStrategyPage;
