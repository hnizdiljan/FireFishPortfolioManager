import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { PortfolioSummary } from '../../types/portfolioTypes';

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
  <Card hoverable style={{ height: '100%', transition: 'all 0.3s ease' }}>
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
  
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard 
          title="Active Loans" 
          value={summary.activeLoanCount.toString()}
          subValue={formatCzk(summary.totalLoanAmountCzk)}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard 
          title="BTC Allocation" 
          value={formatBtc(summary.allocatedBtc)}
          subValue={formatCzk(summary.allocatedBtc * summary.currentBtcPriceCzk)}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard 
          title="LTV Ratio" 
          value={typeof summary.ltvPercent === 'number' ? `${summary.ltvPercent.toFixed(1)}%` : 'N/A'}
          subValue="Loan-to-Value"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard 
          title="Total Loaned Amount" 
          value={formatCzk(summary.totalLoanAmountCzk)}
          subValue="Active loans only"
        />
      </Col>
    </Row>
  );
};
