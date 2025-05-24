import React, { useState, useCallback } from 'react';
import { Card, Typography, Spin, Empty, Switch, Space, Statistic, Row, Col, Tag, Button, Dropdown, Alert, Breadcrumb } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, DownloadOutlined, MoreOutlined, InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoanDto } from '@/types';
import { useLoanMetrics, LoanMetricsDataPoint, ViewLevel } from '@/hooks/useLoanMetrics';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ChartContainer = styled(Card)<{ $isMobile: boolean }>`
  .ant-card-body {
    padding: ${({ $isMobile }) => ($isMobile ? '16px 12px' : '24px')};
  }
  
  @media (max-width: 576px) {
    .ant-card-body {
      padding: 12px 8px;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

const ControlsContainer = styled.div<{ $isMobile: boolean }>`
  margin-bottom: 16px;
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? 'column' : 'row')};
  justify-content: space-between;
  align-items: ${({ $isMobile }) => ($isMobile ? 'flex-start' : 'center')};
  gap: ${({ $isMobile }) => ($isMobile ? '12px' : '16px')};
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const ControlsGroup = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? 'column' : 'row')};
  gap: ${({ $isMobile }) => ($isMobile ? '8px' : '16px')};
  width: ${({ $isMobile }) => ($isMobile ? '100%' : 'auto')};
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }
`;

const SwitchContainer = styled.div<{ $isMobile: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ $isMobile }) => ($isMobile ? '4px 0' : '0')};
  min-height: ${({ $isMobile }) => ($isMobile ? '32px' : 'auto')};
  
  .ant-switch {
    flex-shrink: 0;
  }
  
  span {
    font-size: ${({ $isMobile }) => ($isMobile ? '13px' : '14px')};
    line-height: 1.4;
  }
  
  @media (max-width: 576px) {
    padding: 6px 0;
    min-height: 36px;
    
    span {
      font-size: 12px;
    }
  }
`;

const MetricsContainer = styled.div<{ $isMobile: boolean }>`
  margin-bottom: 24px;
  padding: ${({ $isMobile }) => ($isMobile ? '12px' : '16px')};
  background-color: #fafafa;
  border-radius: 8px;
  
  @media (max-width: 576px) {
    padding: 8px 12px;
    margin-bottom: 16px;
  }
`;

const TrendContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const ChartHeader = styled.div<{ $isMobile: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: ${({ $isMobile }) => ($isMobile ? 'flex-start' : 'center')};
  margin-bottom: 16px;
  flex-direction: ${({ $isMobile }) => ($isMobile ? 'column' : 'row')};
  gap: ${({ $isMobile }) => ($isMobile ? '12px' : '0')};
  
  h4 {
    font-size: ${({ $isMobile }) => ($isMobile ? '18px' : '20px')} !important;
    margin: 0 !important;
  }
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    h4 {
      font-size: 16px !important;
    }
  }
`;

const InfoContainer = styled.div<{ $isMobile: boolean }>`
  margin-bottom: ${({ $isMobile }) => ($isMobile ? '12px' : '16px')};
  
  .ant-alert {
    font-size: ${({ $isMobile }) => ($isMobile ? '12px' : '14px')};
  }
  
  @media (max-width: 576px) {
    margin-bottom: 8px;
    
    .ant-alert {
      font-size: 11px;
    }
    
    .ant-alert-message {
      font-size: 12px;
    }
  }
`;

const NavigationContainer = styled.div<{ $isMobile: boolean }>`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: ${({ $isMobile }) => ($isMobile ? 'column' : 'row')};
  gap: ${({ $isMobile }) => ($isMobile ? '8px' : '0')};
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 12px;
  }
`;

const ResponsiveChartContainer = styled.div<{ $isMobile: boolean }>`
  height: ${({ $isMobile }) => ($isMobile ? '350px' : '450px')};
  width: 100%;
  
  @media (max-width: 576px) {
    height: 300px;
  }
  
  .recharts-wrapper {
    .recharts-legend-wrapper {
      .recharts-legend-item {
        font-size: ${({ $isMobile }) => ($isMobile ? '11px' : '12px')} !important;
      }
    }
    
    .recharts-cartesian-axis-tick-value {
      font-size: ${({ $isMobile }) => ($isMobile ? '10px' : '12px')} !important;
    }
  }
  
  @media (max-width: 576px) {
    .recharts-wrapper {
      .recharts-legend-wrapper {
        .recharts-legend-item {
          font-size: 9px !important;
        }
      }
      
      .recharts-cartesian-axis-tick-value {
        font-size: 8px !important;
      }
    }
  }
`;

interface LoanMetricsChartProps {
  loans: LoanDto[];
  btcPrice: number;
  isLoading?: boolean;
}

const LoanMetricsChart: React.FC<LoanMetricsChartProps> = ({ 
  loans, 
  btcPrice, 
  isLoading = false 
}) => {
  const [showProfitLoss, setShowProfitLoss] = useState(true);
  const [showActiveLoanCount, setShowActiveLoanCount] = useState(false);
  const [showCollateralValue, setShowCollateralValue] = useState(false);
  const [showBtcPrice, setShowBtcPrice] = useState(false);
  
  // New state for drill-down functionality
  const [viewLevel, setViewLevel] = useState<ViewLevel>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  const { isMobile, isTablet } = useBreakpoint();

  const { 
    chartData, 
    currentMetrics, 
    trends, 
    isLoadingPriceHistory, 
    priceHistoryError 
  } = useLoanMetrics(loans, btcPrice, viewLevel, selectedMonth);

  const handleChartClick = useCallback((data: any) => {
    if (viewLevel === 'monthly' && data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      if (clickedData.period) {
        setSelectedMonth(clickedData.period);
        setViewLevel('daily');
      }
    }
  }, [viewLevel]);

  const handleBackToMonthly = useCallback(() => {
    setViewLevel('monthly');
    setSelectedMonth(undefined);
  }, []);

  const getBreadcrumbItems = () => {
    const items = [
      {
        title: 'Měsíční přehled',
        onClick: viewLevel === 'daily' ? handleBackToMonthly : undefined
      }
    ];

    if (viewLevel === 'daily' && selectedMonth) {
      const monthDate = new Date(selectedMonth + '-01');
      items.push({
        title: monthDate.toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' }),
        onClick: undefined
      });
    }

    return items;
  };

  const downloadCSV = useCallback((data: any[], filename: string) => {
    const headers = [
      'Datum',
      'Celková částka ke splacení (CZK)',
      'Současná hodnota (CZK)',
      'Počet aktivních půjček',
      'Kumulativně půjčeno (CZK)',
      'Zisk/Ztráta (CZK)',
      'Potenciální hodnota (CZK)',
      'Průměrná výše půjčky (CZK)',
      'Hodnota kolaterálu (CZK)',
      'BTC cena (CZK)'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.displayLabel || new Date(row.period || row.date).toLocaleDateString('cs-CZ'),
        row.totalRepaymentAmount.toFixed(2),
        row.totalCurrentValue.toFixed(2),
        row.activeLoanCount,
        row.cumulativeLoaned.toFixed(2),
        row.profitLoss.toFixed(2),
        row.potentialValue.toFixed(2),
        row.averageLoanAmount.toFixed(2),
        row.totalCollateralValue.toFixed(2),
        row.btcPrice.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'Exportovat jako CSV',
      icon: <DownloadOutlined />,
      onClick: () => downloadCSV(chartData, `loan-metrics-${viewLevel}-${new Date().toISOString().split('T')[0]}.csv`)
    },
    {
      key: 'summary',
      label: 'Exportovat souhrn',
      icon: <DownloadOutlined />,
      onClick: () => {
        if (currentMetrics) {
          const summaryData = [{
            period: new Date().toISOString().split('T')[0],
            displayLabel: 'Aktuální stav',
            totalRepaymentAmount: currentMetrics.totalRepaymentAmount,
            totalCurrentValue: currentMetrics.totalCurrentValue,
            activeLoanCount: currentMetrics.activeLoanCount,
            cumulativeLoaned: currentMetrics.cumulativeLoaned,
            profitLoss: currentMetrics.profitLoss,
            potentialValue: 0, // Not available in current metrics
            averageLoanAmount: currentMetrics.averageLoanAmount,
            totalCollateralValue: currentMetrics.totalCollateralValue,
            btcPrice: btcPrice
          }];
          downloadCSV(summaryData, `loan-summary-${new Date().toISOString().split('T')[0]}.csv`);
        }
      }
    }
  ];

  const formatCurrency = (value: number) => {
    return `${Math.round(value).toLocaleString()} CZK`;
  };

  const formatTooltipValue = (value: unknown, name: string) => {
    const numValue = Number(value);
    if (name === 'Počet aktivních půjček') {
      return [numValue, name];
    }
    if (name === 'BTC cena') {
      return [formatCurrency(numValue), name];
    }

    return [formatCurrency(numValue), name];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;

      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '8px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {`${viewLevel === 'monthly' ? 'Měsíc' : 'Den'}: ${data.displayLabel || label}`}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            {`BTC cena: ${formatCurrency(data.btcPrice)}`}
          </p>
          {viewLevel === 'monthly' && (
            <p style={{ margin: 0, fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
              Kliknutím zobrazíte denní detail
            </p>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {`${entry.name}: ${formatTooltipValue(entry.value, entry.name)[0]}`}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'decreasing':
        return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <MinusOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return '#52c41a';
      case 'decreasing':
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  if (isLoading || isLoadingPriceHistory) {
    return (
      <ChartContainer $isMobile={isMobile}>
        <LoadingContainer>
          <Spin size="large" />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            {isLoadingPriceHistory && <Text type="secondary">Načítám historická data cen BTC...</Text>}
          </div>
        </LoadingContainer>
      </ChartContainer>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <ChartContainer $isMobile={isMobile}>
        <ChartHeader $isMobile={isMobile}>
          <Title level={4}>Vývoj metrik půjček v čase</Title>
        </ChartHeader>
        <Empty description="Žádná data k zobrazení" />
      </ChartContainer>
    );
  }

  return (
    <ChartContainer $isMobile={isMobile}>
      <ChartHeader $isMobile={isMobile}>
        <Title level={4} style={{ margin: 0 }}>
          Vývoj metrik půjček v čase
        </Title>
        <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} placement="bottomRight">
          <Button icon={<MoreOutlined />} type="text">
            Export
          </Button>
        </Dropdown>
      </ChartHeader>

      <NavigationContainer $isMobile={isMobile}>
        <Breadcrumb
          items={getBreadcrumbItems()}
          style={{ margin: 0 }}
        />
        {viewLevel === 'daily' && (
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBackToMonthly}
            size="small"
          >
            Zpět na měsíční přehled
          </Button>
        )}
      </NavigationContainer>

      <InfoContainer $isMobile={isMobile}>
        <Alert
          message="Historická data cen BTC"
          description={`Graf používá skutečné historické ceny BTC/CZK pro přesný výpočet hodnoty portfolia v čase. ${viewLevel === 'monthly' ? 'Kliknutím na měsíc zobrazíte denní detail.' : 'Zobrazený je denní detail vybraného měsíce.'}`}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        {priceHistoryError && (
          <Alert
            message="Chyba při načítání historických dat"
            description={`${priceHistoryError}. Graf používá aktuální cenu BTC pro všechny výpočty.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </InfoContainer>

      {currentMetrics && (
        <MetricsContainer $isMobile={isMobile}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Aktivní půjčky"
                value={currentMetrics.activeLoanCount}
                suffix="ks"
              />
              <TrendContainer>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Průměrná výše: {formatCurrency(currentMetrics.averageLoanAmount)}
                </Text>
              </TrendContainer>
            </Col>
            
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Ke splacení"
                value={currentMetrics.totalRepaymentAmount}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Col>
            
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Současná hodnota"
                value={currentMetrics.totalCurrentValue}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <TrendContainer>
                <Tag color={trends.valueGrowth >= 0 ? 'green' : 'red'}>
                  {trends.valueGrowth >= 0 ? '+' : ''}{trends.valueGrowth.toFixed(1)}% měsíčně
                </Tag>
              </TrendContainer>
            </Col>
            
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Zisk/Ztráta"
                value={currentMetrics.profitLoss}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ 
                  color: currentMetrics.profitLoss >= 0 ? '#3f8600' : '#cf1322' 
                }}
                suffix={`(${currentMetrics.profitLossPercentage.toFixed(1)}%)`}
              />
              <TrendContainer>
                {getTrendIcon(trends.profitTrend)}
                <Text 
                  style={{ 
                    fontSize: '12px',
                    color: getTrendColor(trends.profitTrend)
                  }}
                >
                  {trends.profitTrend === 'increasing' ? 'Rostoucí trend' :
                   trends.profitTrend === 'decreasing' ? 'Klesající trend' : 'Stabilní'}
                </Text>
              </TrendContainer>
            </Col>

            {showCollateralValue && (
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Hodnota kolaterálu"
                  value={currentMetrics.totalCollateralValue}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
            )}
          </Row>
        </MetricsContainer>
      )}
      
      <ControlsContainer $isMobile={isMobile}>
        <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>Zobrazené metriky:</Text>
        <ControlsGroup $isMobile={isMobile}>
          <SwitchContainer $isMobile={isMobile}>
            <Switch
              checked={showProfitLoss}
              onChange={setShowProfitLoss}
              size="small"
            />
            <Text>Zisk/Ztráta</Text>
          </SwitchContainer>
          
          <SwitchContainer $isMobile={isMobile}>
            <Switch
              checked={showActiveLoanCount}
              onChange={setShowActiveLoanCount}
              size="small"
            />
            <Text>Počet aktivních půjček</Text>
          </SwitchContainer>

          <SwitchContainer $isMobile={isMobile}>
            <Switch
              checked={showCollateralValue}
              onChange={setShowCollateralValue}
              size="small"
            />
            <Text>Hodnota kolaterálu</Text>
          </SwitchContainer>

          <SwitchContainer $isMobile={isMobile}>
            <Switch
              checked={showBtcPrice}
              onChange={setShowBtcPrice}
              size="small"
            />
            <Text>BTC cena</Text>
          </SwitchContainer>
        </ControlsGroup>
      </ControlsContainer>
      
      <ResponsiveChartContainer $isMobile={isMobile}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ 
              top: 5, 
              right: isMobile ? 10 : 30, 
              left: isMobile ? 10 : 20, 
              bottom: 5 
            }}
            onClick={handleChartClick}
            style={{ cursor: viewLevel === 'monthly' ? 'pointer' : 'default' }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(value) => {
                // Find the corresponding data point to get display label
                const dataPoint = chartData.find(d => d.period === value);
                if (dataPoint) {
                  return dataPoint.displayLabel;
                }
                // Fallback formatting
                if (viewLevel === 'monthly') {
                  const date = new Date(value + '-01');
                  return date.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' });
                } else {
                  const date = new Date(value);
                  return `${date.getDate()}.${date.getMonth() + 1}.`;
                }
              }}
            />
            <YAxis 
              yAxisId="currency"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            {(showActiveLoanCount || showBtcPrice) && (
              <YAxis 
                yAxisId="secondary"
                orientation="right"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickFormatter={(value) => showBtcPrice ? `${Math.round(value / 1000)}k` : `${value}`}
              />
            )}
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }} />
            
            <Line
              yAxisId="currency"
              type="monotone"
              dataKey="totalRepaymentAmount"
              stroke="#ff7300"
              strokeWidth={isMobile ? 1.5 : 2}
              dot={{ r: isMobile ? 2 : 3 }}
              name="Celková částka ke splacení"
              connectNulls={false}
            />
            
            <Line
              yAxisId="currency"
              type="monotone"
              dataKey="totalCurrentValue"
              stroke="#1890ff"
              strokeWidth={isMobile ? 1.5 : 2}
              dot={{ r: isMobile ? 2 : 3 }}
              name="Současná hodnota všech půjček"
              connectNulls={false}
            />
            
            <Line
              yAxisId="currency"
              type="monotone"
              dataKey="cumulativeLoaned"
              stroke="#52c41a"
              strokeWidth={isMobile ? 1.5 : 2}
              dot={{ r: isMobile ? 2 : 3 }}
              name="Kumulativně půjčeno"
              connectNulls={false}
            />

            {showProfitLoss && (
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="profitLoss"
                stroke="#722ed1"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 2 : 3 }}
                name="Zisk/Ztráta"
                connectNulls={false}
              />
            )}

            {showCollateralValue && (
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="totalCollateralValue"
                stroke="#eb2f96"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 2 : 3 }}
                name="Hodnota kolaterálu"
                connectNulls={false}
              />
            )}

            {showActiveLoanCount && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="activeLoanCount"
                stroke="#fa8c16"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 2 : 3 }}
                name="Počet aktivních půjček"
                connectNulls={false}
              />
            )}

            {showBtcPrice && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="btcPrice"
                stroke="#13c2c2"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 2 : 3 }}
                name="BTC cena"
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ResponsiveChartContainer>

    </ChartContainer>
  );
};

export default LoanMetricsChart; 