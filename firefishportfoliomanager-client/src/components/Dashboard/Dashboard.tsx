import React from 'react';
import { PortfolioSummaryRow } from './PortfolioSummaryComponents';
import { UpcomingRepayment, RecentLoans } from './DashboardComponents';
import LoanMetricsChart from './LoanMetricsChart';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import { AuthState, useAuthStore } from '@store/authStore';
import { useDashboardData } from '@hooks/useDashboardData';
import { statusDisplay } from '@utils/loanUtils';
import { usePortfolioSummary } from '@hooks/usePortfolioSummary';
import { useBreakpoint } from '@hooks/useBreakpoint';
import type { Loan } from '@/types/loanTypes';
import { Row, Col, Card, Typography, Divider, Space } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

const DashboardContainer = styled.div<{ $isMobile: boolean }>`
  max-width: ${({ $isMobile }) => ($isMobile ? '100%' : '1200px')};
  margin: 0 auto;
  padding: ${({ $isMobile }) => ($isMobile ? '16px 8px' : '32px 16px')};
  
  @media (max-width: 576px) {
    padding: 12px 4px;
  }
`;

const QuickMetricsCard = styled(Card)`
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    min-height: 100px;
    
    .ant-card-body {
      padding: 16px;
    }
  }
  
  @media (max-width: 576px) {
    min-height: 80px;
    
    .ant-card-body {
      padding: 12px;
    }
  }
`;

const SectionTitle = styled(Title)<{ $isMobile: boolean }>`
  margin-bottom: 16px !important;
  color: #1f1f1f;
  font-size: ${({ $isMobile }) => ($isMobile ? '18px' : '20px')} !important;
  
  &::after {
    content: '';
    display: block;
    width: 40px;
    height: 3px;
    background: linear-gradient(135deg, #1890ff, #36cfc9);
    margin-top: 8px;
  }
  
  @media (max-width: 576px) {
    font-size: 16px !important;
    margin-bottom: 12px !important;
  }
`;

const HeaderSection = styled.div<{ $isMobile: boolean }>`
  margin-bottom: ${({ $isMobile }) => ($isMobile ? '16px' : '24px')};
  
  h2 {
    font-size: ${({ $isMobile }) => ($isMobile ? '20px' : '28px')} !important;
    margin-bottom: ${({ $isMobile }) => ($isMobile ? '4px' : '8px')} !important;
  }
  
  @media (max-width: 576px) {
    margin-bottom: 12px;
    
    h2 {
      font-size: 18px !important;
    }
  }
`;

const StyledSpace = styled(Space)<{ $isMobile: boolean }>`
  width: 100%;
  
  .ant-space-item {
    width: 100%;
  }
`;

// Make sure this file is treated as a module
export {};

// Define and export the Dashboard component
const Dashboard: React.FC = () => {
  const { dashboardData, isLoading, error } = useDashboardData();
  const { user, loans, btcPrice } = dashboardData;
  const userName = useAuthStore((state: AuthState) => state.userName);
  const { isMobile, isTablet } = useBreakpoint();
  
  // Use the portfolio summary hook
  const portfolioSummary = usePortfolioSummary();

  // Filter to only show active loans
  const activeLoans = loans.filter(l => l.status !== 'Closed');
  
  // Calculate recentLoansSummary here as it's specific to this component's view
  const recentLoansSummary = [...loans].sort((a, b) => 
      new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime()
    ).slice(0, 3).map((loan: Loan) => ({
      id: loan.loanId || `ID-${String(loan.id)}`,
      date: new Date(loan.loanDate).toISOString().split('T')[0],
      amount: loan.loanAmountCzk, 
      status: statusDisplay[loan.status]?.text || 'Unknown'
    }));
    
  if (isLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: isMobile ? '20px 0' : '40px 0',
        fontSize: isMobile ? '14px' : '16px'
      }}>
        Loading dashboard...
      </div>
    );
  }

  const responsiveSize = isMobile ? 'small' : isTablet ? 'middle' : 'large';
  const responsiveGutter: [number, number] = isMobile ? [8, 8] : isTablet ? [16, 16] : [24, 24];

  return (
    <ErrorBoundary>
      <DashboardContainer $isMobile={isMobile}>
        <StyledSpace 
          direction="vertical" 
          size={responsiveSize} 
          $isMobile={isMobile}
        >
          {/* Header Section */}
          <HeaderSection $isMobile={isMobile}>
            <Title level={2}>Dashboard</Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 14 : 16 }}>
              Welcome back, {userName || user?.name || 'User'}!
            </Text>
          </HeaderSection>

          {error && (
            <Card style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
              <Text type="danger" style={{ fontSize: isMobile ? 12 : 14 }}>
                <b>Error!</b> {error}
              </Text>
            </Card>
          )}

          {/* Portfolio Summary & Key Metrics */}
          {portfolioSummary && (
            <StyledSpace 
              direction="vertical" 
              size={isMobile ? 'small' : 'middle'} 
              $isMobile={isMobile}
            >
              <SectionTitle level={3} $isMobile={isMobile}>
                Portfolio Overview
              </SectionTitle>
              
              <PortfolioSummaryRow summary={portfolioSummary} />
              
              {portfolioSummary.nearestRepayment && (
                <UpcomingRepayment nearestRepayment={portfolioSummary.nearestRepayment} />
              )}
            </StyledSpace>
          )}

          {/* Performance Chart */}
          <StyledSpace 
            direction="vertical" 
            size={isMobile ? 'small' : 'middle'} 
            $isMobile={isMobile}
          >
            <SectionTitle level={3} $isMobile={isMobile}>
              Performance Analytics
            </SectionTitle>
            <LoanMetricsChart 
              loans={loans} 
              btcPrice={btcPrice} 
              isLoading={isLoading} 
            />
          </StyledSpace>

          {/* Activity & Quick Actions */}
          <StyledSpace 
            direction="vertical" 
            size={isMobile ? 'small' : 'middle'} 
            $isMobile={isMobile}
          >
            <SectionTitle level={3} $isMobile={isMobile}>
              Recent Activity
            </SectionTitle>
            <Row gutter={responsiveGutter}>
              <Col xs={24} lg={12}>
                <RecentLoans loans={recentLoansSummary} />
              </Col>
              <Col xs={24} lg={12}>
                <QuickMetricsCard>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                      Current BTC Price
                    </Text>
                    <Title 
                      level={isMobile ? 4 : 3} 
                      style={{ margin: 0, color: '#1890ff' }}
                    >
                      {btcPrice ? btcPrice.toLocaleString() : 'N/A'} CZK
                    </Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
                      Real-time market price
                    </Text>
                  </Space>
                </QuickMetricsCard>
              </Col>
            </Row>
          </StyledSpace>
        </StyledSpace>
      </DashboardContainer>
    </ErrorBoundary>
  );
};

export default Dashboard;
