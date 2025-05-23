import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSellStrategy } from '@hooks/useSellStrategy';
import LoanDetailOrders from './LoanDetailOrders';
import ExitStrategyForm from './ExitStrategyForm';
import { useDashboardData } from '@hooks/useDashboardData';
import { useExitStrategy } from '@hooks/useExitStrategy';
import { InputNumber, Button, Typography, Spin, Alert, Card, Space, Descriptions, Tag, Modal } from 'antd';
import { InfoCircleOutlined, DollarCircleOutlined, CalculatorOutlined, PlayCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import type { Loan, SellOrder } from '@/types/loanTypes';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: auto;
`;

const SectionCard = styled(Card)`
  margin-bottom: 24px;
`;

const ProfitText = styled(Typography.Text)<{ profit?: number | null }>`
  color: ${({ profit }) => {
    if (profit === null || profit === undefined) return 'grey'; // Ant Design Grey
    if (profit > 0) return '#52c41a'; // Ant Design Green 6
    if (profit < 0) return '#f5222d'; // Ant Design Red 5

    return 'inherit'; // Default text color
  }};
  font-weight: bold;
`;

const SellStrategyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? parseInt(id, 10) : undefined;

  const {
    loan,
    isLoading: isSellStrategyLoading,
    isExecuting,
    error: sellStrategyError,
    refreshData,
    executeStrategy
  } = useSellStrategy(numericId);

  const { dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData();
  const btcPrice = dashboardData.btcPrice;

  const [simulatedBtcPriceForRemaining, setSimulatedBtcPriceForRemaining] = useState<number | null>(null);

  const { strategy: exitStrategy, isLoading: isStrategyLoading, error: strategyError } = useExitStrategy(numericId);

  useEffect(() => {
    if (loan) { 
        let defaultSimulatedPrice = 0; 
        const currentLoanTyped = loan as (Loan & { sellOrders?: SellOrder[] });

        if (currentLoanTyped.sellOrders && currentLoanTyped.sellOrders.length > 0) {
            const plannedOrders = currentLoanTyped.sellOrders.filter(
                (o: SellOrder) => o.status === 'Planned' || o.status === 'Submitted' || o.status === 'PartiallyFilled'
            );
            if (plannedOrders.length > 0) {
                const maxPrice = Math.max(...plannedOrders.map((o: SellOrder) => o.pricePerBtc || 0));
                if (maxPrice > 0) {
                    defaultSimulatedPrice = maxPrice;
                }
            }
        }
        
        if (defaultSimulatedPrice <= 0 && btcPrice) {
             defaultSimulatedPrice = btcPrice;
        }
        setSimulatedBtcPriceForRemaining(defaultSimulatedPrice > 0 ? defaultSimulatedPrice : null);
    }
  }, [btcPrice, loan]);

  const czkFromPlannedSellOrdersOnly = useMemo(() => {
    if (!loan || loan.potentialValueCzk === undefined || loan.remainingBtcAfterStrategy === undefined || loan.remainingBtcAfterStrategy <= 0.00000001) {
        return loan?.potentialValueCzk ?? 0;
    }
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
    if (backendValuationPriceForRemainingBtc <= 0) {
        return loan.potentialValueCzk ?? 0; 
    }
    const valueOfRemainingBtcAsCalculatedOnBackend = loan.remainingBtcAfterStrategy * backendValuationPriceForRemainingBtc;

    return (loan.potentialValueCzk ?? 0) - valueOfRemainingBtcAsCalculatedOnBackend;
  }, [loan]);

  const userSimulatedBtcPriceNum = simulatedBtcPriceForRemaining || 0;
  const valueOfRemainingBtcUserSimulated = (loan?.remainingBtcAfterStrategy ?? 0) * userSimulatedBtcPriceNum;
  const dynamicallyCalculatedPotentialValue = czkFromPlannedSellOrdersOnly + valueOfRemainingBtcUserSimulated;

  let potentialProfitPercentCalculated: number | null = null;
  if (loan?.repaymentAmountCzk && loan.repaymentAmountCzk > 0 && dynamicallyCalculatedPotentialValue !== undefined) {
    potentialProfitPercentCalculated = ((dynamicallyCalculatedPotentialValue - loan.repaymentAmountCzk) / loan.repaymentAmountCzk) * 100;
  }

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

  let currentProfitPercent: number | null = null;
  if (loan?.repaymentAmountCzk && loan.repaymentAmountCzk > 0 && currentValue !== null) {
    currentProfitPercent = ((currentValue - loan.repaymentAmountCzk) / loan.repaymentAmountCzk) * 100;
  }

  const handleExecuteClick = async () => {
    Modal.confirm({
      title: 'Opravdu chcete provést tuto strategii?',
      content: 'Tato akce zadá prodejní příkazy na Coinmate.',
      okText: 'Provést',
      okType: 'danger',
      cancelText: 'Zrušit',
      onOk: async () => {
        await executeStrategy();
      },
    });
  };

  if (isSellStrategyLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" tip="Načítám strategii...">
          <div style={{ minHeight: '200px' }} />
        </Spin>
      </div>
    );
  }

  if (sellStrategyError) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><Alert message={`Chyba: ${sellStrategyError}`} type="error" showIcon /></div>;
  }

  if (!loan) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><Alert message="Půjčka nenalezena." type="warning" showIcon /></div>;
  }
  
  const descriptionItems = [
    { key: '1', label: 'ID Půjčky (FF)', children: loan.loanId },
    { key: '2', label: 'Datum půjčky', children: new Date(loan.loanDate).toLocaleDateString() },
    { key: '3', label: 'Částka půjčky', children: `${loan.loanAmountCzk?.toLocaleString()} CZK` },
    { key: '4', label: 'Částka k splacení', children: `${loan.repaymentAmountCzk?.toLocaleString()} CZK` },
    {
        key: '5',
        label: 'Množství BTC nakoupeno',
        children: (
            <Space direction="vertical" size="small">
                <Typography.Text>Před poplatky: <Typography.Text code>{loan.purchasedBtc !== undefined ? loan.purchasedBtc.toFixed(8) : 'N/A'} BTC</Typography.Text></Typography.Text>
                <Typography.Text>Po poplatcích: <Typography.Text code>{btcAfterFees !== undefined ? btcAfterFees.toFixed(8) : 'N/A'} BTC</Typography.Text></Typography.Text>
            </Space>
        )
    },
    {
        key: '6',
        label: 'Aktuální strategie',
        children: isStrategyLoading ? <Spin size="small" /> : strategyError ? <Tag color="error">{strategyError}</Tag> : <Tag color="blue">{exitStrategy?.type ?? 'Není definována'}</Tag>
    },
    {
        key: '7',
        label: 'Aktuální hodnota (dle trhu)',
        children: isDashboardLoading ? <Spin size="small" /> : dashboardError ? <Tag color="error">{dashboardError}</Tag> : currentValue !== null ? 
            <Space><Typography.Text code>{currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} CZK</Typography.Text> 
                   {currentProfitPercent !== null && <ProfitText profit={currentProfitPercent}>({currentProfitPercent.toFixed(2)} %)</ProfitText>}</Space> : 'N/A'
    },
    {
        key: '8',
        label: 'Potenciální hodnota strategie',
        children: typeof dynamicallyCalculatedPotentialValue === 'number' ? 
            <Space><Typography.Text code>{dynamicallyCalculatedPotentialValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} CZK</Typography.Text>
                   {potentialProfitPercentCalculated !== null && <ProfitText profit={potentialProfitPercentCalculated}>({potentialProfitPercentCalculated.toFixed(2)} %)</ProfitText>}</Space> : 'N/A' 
    },
  ];

  if (loan.remainingBtcAfterStrategy !== undefined && loan.remainingBtcAfterStrategy > 0.00000001) {
    descriptionItems.push({
        key: '9',
        label: 'BTC zbývající po strategii',
        children: <Typography.Text code>{(loan.remainingBtcAfterStrategy).toFixed(8)} BTC</Typography.Text>
    });
    descriptionItems.push({
        key: '10',
        label: 'Vaše simulovaná cena pro zbylé BTC',
        children: (
            <InputNumber<number>
                value={simulatedBtcPriceForRemaining}
                onChange={(value) => setSimulatedBtcPriceForRemaining(value)}
                style={{ maxWidth: '200px' }}
                addonAfter="CZK/BTC"
                min={0}
                placeholder="Cena CZK/BTC"
            />
        )
    });
  }

  return (
    <PageContainer>
      <Typography.Title level={2} style={{ marginBottom: '24px' }}>
        Sell Strategy pro půjčku: {loan.loanId}
      </Typography.Title>

      <SectionCard title={<Space><InfoCircleOutlined />Přehled půjčky a strategie</Space>}>
        <Descriptions bordered column={1} size="small" items={descriptionItems} />
      </SectionCard>

      <SectionCard title={<Space><CalculatorOutlined />Definice výstupní strategie</Space>}>
        <ExitStrategyForm loan={loan} onSaved={refreshData} />
      </SectionCard>
      
      <SectionCard title={<Space><DollarCircleOutlined />Prodejní příkazy (Sell Orders)</Space>}>
        <LoanDetailOrders 
          loan={{
            ...loan, 
            sellOrders: currentSellOrders, 
            userId: (loan as Loan & { userId?: string }).userId || ''
          }}
          refresh={refreshData} 
        />
      </SectionCard>

      <SectionCard title={<Space><PlayCircleOutlined />Provedení strategie</Space>}>
        <Typography.Paragraph>
          Kliknutím na tlačítko níže se pokusíte nahrát všechny &apos;Planned&apos; ordery na Coinmate a zrušit &apos;Submitted&apos; ordery, které již nejsou součástí aktuálně uložené strategie.
          Tato akce je nevratná.
        </Typography.Paragraph>
        <Button 
          type="primary" 
          onClick={handleExecuteClick} 
          loading={isExecuting} 
          danger 
          size="large"
          style={{marginTop: '10px'}}
        >
          Provést strategii a zadat/zrušit ordery
        </Button>
        {isExecuting && <Typography.Text style={{marginLeft: '10px'}}>Provádím...</Typography.Text>}
      </SectionCard>

    </PageContainer>
  );
};

export default SellStrategyPage;
