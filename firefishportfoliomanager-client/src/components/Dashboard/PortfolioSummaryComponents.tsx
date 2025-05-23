import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { PortfolioSummary } from '../../types/portfolioTypes';
import PortfolioChart from '../Statistics/PortfolioChart';
import { useStatisticsService } from '../../services/statisticsService';

const { Text } = Typography;

// Make sure this file is treated as a module
export {};

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subValue }) => (
  <Card hoverable style={{ height: '100%' }}>
    <Statistic title={title} value={value} />
    {subValue && (
      <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
        {subValue}
      </Text>
    )}
  </Card>
);

interface SummaryRowProps {
  summary: PortfolioSummary;
}

export const PortfolioSummaryRow: React.FC<SummaryRowProps> = ({ summary }) => {
  // Format values with localization
  const formatCzk = (value?: number) => (typeof value === 'number' && !isNaN(value)) ? `${value.toLocaleString()} CZK` : 'N/A';
  const formatBtc = (value: number) => `${value} BTC`;
  
  const { chartData, isLoading, error } = useStatisticsService();
  
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Portfolio Performance graf - full width */}
      <Card hoverable style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            Portfolio Performance
          </Text>
        </div>
        {isLoading ? (
          <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text type="secondary">Načítání grafu…</Text>
          </div>
        ) : error ? (
          <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text type="danger">Chyba při načítání dat</Text>
          </div>
        ) : chartData ? (
          <div style={{ width: '100%', minHeight: 300 }}>
            {/* TODO: Hierarchická osa X (rok/měsíc/den) - zde lze později rozšířit */}
            <PortfolioChart data={chartData} />
          </div>
        ) : (
          <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text type="secondary">Žádná data pro graf</Text>
          </div>
        )}
      </Card>
      
      {/* Ostatní karty v gridu */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <SummaryCard 
            title="BTC Allocation" 
            value={formatBtc(summary.allocatedBtc)}
            subValue={formatCzk(summary.allocatedBtc * summary.currentBtcPriceCzk)}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <SummaryCard 
            title="LTV (%)" 
            value={typeof summary.ltvPercent === 'number' ? `${summary.ltvPercent.toFixed(0)}%` : 'N/A'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <SummaryCard 
            title="Active Loans" 
            value={summary.activeLoanCount.toString()}
            subValue={formatCzk(summary.totalLoanAmountCzk)}
          />
        </Col>
      </Row>
    </Space>
  );
};
