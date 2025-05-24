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
import { ProfitText } from '../Common/ProfitText';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
`;

const SectionCard = styled(Card)`
  margin-bottom: 24px;
  
  .ant-card-head {
    background: #f8f9fa;
  }
`;

const SellStrategyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = parseInt(id || '', 10);
  
  const [simulatedBtcPriceForRemaining, setSimulatedBtcPriceForRemaining] = useState<number | null>(null);

  const { loan, isLoading: isSellStrategyLoading, error: sellStrategyError, refreshData, executeStrategy, isExecuting } = useSellStrategy(numericId);
  const { dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData();
  const btcPrice = dashboardData?.btcPrice;
  const { strategy: exitStrategy, isLoading: isStrategyLoading, error: strategyError } = useExitStrategy(numericId);

  // Nastavení defaultní simulované ceny na základě nejvyšší ceny z SELL orderů
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

  // Výpočet hodnoty ze SELL orderů (bez zbývajících BTC) - pro non-SmartDistribution strategie
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
            const prices = plannedOrders.map((o: SellOrder) => o.pricePerBtc || 0);
            backendValuationPriceForRemainingBtc = Math.max(...prices);
        }
    }
    if (backendValuationPriceForRemainingBtc <= 0) {
        return loan.potentialValueCzk ?? 0; 
    }
    const valueOfRemainingBtcAsCalculatedOnBackend = loan.remainingBtcAfterStrategy * backendValuationPriceForRemainingBtc;
    const result = (loan.potentialValueCzk ?? 0) - valueOfRemainingBtcAsCalculatedOnBackend;
    
    return result;
  }, [loan]);

  // Získat nejvyšší cenu z sell orderů pro informaci
  const highestSellOrderPrice = useMemo(() => {
    if (!loan) return null;
    const currentLoanTyped = loan as (Loan & { sellOrders?: SellOrder[] });
    if (currentLoanTyped.sellOrders && currentLoanTyped.sellOrders.length > 0) {
      const plannedOrders = currentLoanTyped.sellOrders.filter(
        (o: SellOrder) => o.status === 'Planned' || o.status === 'Submitted' || o.status === 'PartiallyFilled'
      );
      if (plannedOrders.length > 0) {
        return Math.max(...plannedOrders.map((o: SellOrder) => o.pricePerBtc || 0));
      }
    }
    return null;
  }, [loan]);

  // Pro SmartDistribution, EquidistantLadder a EquifrequentLadder používáme čistě backend hodnotu (podle přesného výpočtu)
  // Pro ostatní strategie používáme dynamický výpočet s uživatelskou simulací
  const useBackendValue = exitStrategy?.type === 'SmartDistribution' || 
                         exitStrategy?.type === 'EquidistantLadder' || 
                         exitStrategy?.type === 'EquifrequentLadder';
  
  let dynamicallyCalculatedPotentialValue: number;
  let potentialProfitPercentCalculated: number | null = null;
  
  if (useBackendValue) {
    // Pro SmartDistribution, EquidistantLadder a EquifrequentLadder: používáme backend hodnotu (přesně podle algoritmů)
    dynamicallyCalculatedPotentialValue = loan?.potentialValueCzk ?? 0;
    if (loan?.repaymentAmountCzk && loan.repaymentAmountCzk > 0) {
      potentialProfitPercentCalculated = ((dynamicallyCalculatedPotentialValue - loan.repaymentAmountCzk) / loan.repaymentAmountCzk) * 100;
    }
  } else {
    // Pro ostatní strategie: uživatelsky nastavitelná simulace
    const userSimulatedBtcPriceNum = simulatedBtcPriceForRemaining || 0;
    const valueOfRemainingBtcUserSimulated = (loan?.remainingBtcAfterStrategy ?? 0) * userSimulatedBtcPriceNum;
    dynamicallyCalculatedPotentialValue = czkFromPlannedSellOrdersOnly + valueOfRemainingBtcUserSimulated;
    
    if (loan?.repaymentAmountCzk && loan.repaymentAmountCzk > 0 && dynamicallyCalculatedPotentialValue !== undefined) {
      potentialProfitPercentCalculated = ((dynamicallyCalculatedPotentialValue - loan.repaymentAmountCzk) / loan.repaymentAmountCzk) * 100;
    }
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
        children: (
          <Space direction="vertical" size="small">
            <Space>
              <Typography.Text code>
                {typeof dynamicallyCalculatedPotentialValue === 'number' 
                  ? dynamicallyCalculatedPotentialValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                  : 'N/A'} CZK
              </Typography.Text>
              {potentialProfitPercentCalculated !== null && (
                <ProfitText profit={potentialProfitPercentCalculated}>
                  ({potentialProfitPercentCalculated.toFixed(2)} %)
                </ProfitText>
              )}
            </Space>
            {!useBackendValue && (
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                Hodnota se přepočítává podle vaší simulované ceny pro zbylé BTC
              </Typography.Text>
            )}
            {useBackendValue && (
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                ✅ Hodnota odpovídá přesně parametrům strategie (včetně zbývajícího BTC)
              </Typography.Text>
            )}
          </Space>
        )
    },
  ];

  if (loan.remainingBtcAfterStrategy !== undefined && loan.remainingBtcAfterStrategy > 0.00000001) {
    descriptionItems.push({
        key: '9',
        label: 'BTC zbývající po strategii',
        children: <Typography.Text code>{(loan.remainingBtcAfterStrategy).toFixed(8)} BTC</Typography.Text>
    });
    
    // Simulovanou cenu zobrazujeme pro všechny strategie
    if (!useBackendValue) {
      // Pro non-SmartDistribution: editovatelná simulovaná cena
      descriptionItems.push({
        key: '10',
        label: 'Vaše simulovaná cena pro zbylé BTC',
        children: (
          <Space direction="vertical" size="small">
            <InputNumber<number>
                value={simulatedBtcPriceForRemaining}
                onChange={(value) => setSimulatedBtcPriceForRemaining(value)}
                style={{ maxWidth: '200px' }}
                addonAfter="CZK/BTC"
                min={0}
                placeholder="Cena CZK/BTC"
            />
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              {highestSellOrderPrice && (
                <>Default: {highestSellOrderPrice.toLocaleString()} CZK/BTC (nejvyšší cena z SELL orderů)</>
              )}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              Změna této ceny ovlivní výpočet potenciální hodnoty strategie
            </Typography.Text>
          </Space>
        )
      });
    } else {
      // Pro SmartDistribution, EquidistantLadder a EquifrequentLadder: zobrazit simulovanou cenu pouze pro informaci (read-only)
      descriptionItems.push({
        key: '10',
        label: 'Simulovaná cena pro zbylé BTC',
        children: (
          <Space direction="vertical" size="small">
            <Typography.Text code>
              {highestSellOrderPrice ? `${highestSellOrderPrice.toLocaleString()} CZK/BTC` : 'N/A'}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              ✅ Automaticky nastaveno na nejvyšší cenu z SELL orderů
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              Hodnota zbývajícího BTC je automaticky započítána do celkové potenciální hodnoty
            </Typography.Text>
          </Space>
        )
      });
    }
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
            sellOrders: currentSellOrders as any // Convert SellOrder[] to SellOrderBasicDto[]
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