import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { PortfolioSummary } from '../../types/portfolioTypes';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import styled from 'styled-components';

const { Text } = Typography;

const StyledCard = styled(Card)<{ $isMobile: boolean }>`
  height: 100%;
  transition: all 0.3s ease;
  
  .ant-card-body {
    padding: ${({ $isMobile }) => ($isMobile ? '16px 12px' : '24px')};
  }
  
  .ant-statistic-title {
    font-size: ${({ $isMobile }) => ($isMobile ? '12px' : '14px')};
    margin-bottom: ${({ $isMobile }) => ($isMobile ? '4px' : '8px')};
  }
  
  .ant-statistic-content {
    font-size: ${({ $isMobile }) => ($isMobile ? '18px' : '24px')} !important;
  }
  
  @media (max-width: 576px) {
    margin-bottom: 8px;
    
    .ant-card-body {
      padding: 12px 8px;
    }
    
    .ant-statistic-title {
      font-size: 11px;
    }
    
    .ant-statistic-content {
      font-size: 16px !important;
    }
  }
`;

const SubValueText = styled(Text)<{ $isMobile: boolean }>`
  font-size: ${({ $isMobile }) => ($isMobile ? '10px' : '12px')};
  margin-top: 8px;
  display: block;
  
  @media (max-width: 576px) {
    font-size: 9px;
    margin-top: 4px;
  }
`;

// Make sure this file is treated as a module
export {};

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subValue }) => {
  const { isMobile } = useBreakpoint();
  
  return (
    <StyledCard hoverable $isMobile={isMobile}>
      <Statistic title={title} value={value} />
      {subValue && (
        <SubValueText type="secondary" $isMobile={isMobile}>
          {subValue}
        </SubValueText>
      )}
    </StyledCard>
  );
};

interface SummaryRowProps {
  summary: PortfolioSummary;
}

export const PortfolioSummaryRow: React.FC<SummaryRowProps> = ({ summary }) => {
  const { isMobile, isTablet } = useBreakpoint();
  
  // Format values with localization
  const formatCzk = (value?: number) => (typeof value === 'number' && !isNaN(value)) ? `${value.toLocaleString()} CZK` : 'N/A';
  const formatBtc = (value: number) => `${value} BTC`;
  
  // Responsive gutter based on screen size
  const responsiveGutter: [number, number] = isMobile ? [8, 8] : isTablet ? [16, 16] : [24, 24];
  
  return (
    <Row gutter={responsiveGutter}>
      <Col xs={12} sm={12} lg={6}>
        <SummaryCard 
          title="Active Loans" 
          value={summary.activeLoanCount.toString()}
          subValue={isMobile ? `${summary.activeLoanCount} loans` : formatCzk(summary.totalLoanAmountCzk)}
        />
      </Col>
      <Col xs={12} sm={12} lg={6}>
        <SummaryCard 
          title="BTC Allocation" 
          value={formatBtc(summary.allocatedBtc)}
          subValue={isMobile ? 'Allocated' : formatCzk(summary.allocatedBtc * summary.currentBtcPriceCzk)}
        />
      </Col>
      <Col xs={12} sm={12} lg={6}>
        <SummaryCard 
          title="LTV Ratio" 
          value={typeof summary.ltvPercent === 'number' ? `${summary.ltvPercent.toFixed(1)}%` : 'N/A'}
          subValue={isMobile ? 'LTV' : 'Loan-to-Value'}
        />
      </Col>
      <Col xs={12} sm={12} lg={6}>
        <SummaryCard 
          title={isMobile ? 'Total Amount' : 'Total Loaned Amount'}
          value={isMobile ? `${(summary.totalLoanAmountCzk / 1000).toFixed(0)}k CZK` : formatCzk(summary.totalLoanAmountCzk)}
          subValue={isMobile ? 'Loaned' : 'Active loans only'}
        />
      </Col>
    </Row>
  );
};
