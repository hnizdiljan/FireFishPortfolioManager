import React from 'react';
import { PortfolioSummaryRow } from './PortfolioSummaryComponents';
import { UpcomingRepayment, RecentLoans } from './DashboardComponents';
import LoanMetricsChart from './LoanMetricsChart';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import { AuthState, useAuthStore } from '@store/authStore';
import { useDashboardData } from '@hooks/useDashboardData';
import { statusDisplay } from '@utils/loanUtils';
import { usePortfolioSummary } from '@hooks/usePortfolioSummary';
import type { Loan } from '@/types/loanTypes';
import { Row, Col, Card, Typography, Divider, Space } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
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
`;

const SectionTitle = styled(Title)`
  margin-bottom: 16px !important;
  color: #1f1f1f;
  
  &::after {
    content: '';
    display: block;
    width: 40px;
    height: 3px;
    background: linear-gradient(135deg, #1890ff, #36cfc9);
    margin-top: 8px;
  }
`;

// Make sure this file is treated as a module
export {};

// Define and export the Dashboard component
const Dashboard: React.FC = () => {
  const { dashboardData, isLoading, error } = useDashboardData();
  const { user, loans, btcPrice } = dashboardData;
  const userName = useAuthStore((state: AuthState) => state.userName);
  
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
    return <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading dashboard...</div>;
  }

  return (
    <ErrorBoundary>
      <DashboardContainer>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header Section */}
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>Dashboard</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Welcome back, {userName || user?.name || 'User'}!
            </Text>
          </div>

          {error && (
            <Card style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
              <Text type="danger"><b>Error!</b> {error}</Text>
            </Card>
          )}

          {/* Portfolio Summary & Key Metrics */}
          {portfolioSummary && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <SectionTitle level={3}>Portfolio Overview</SectionTitle>
              
              <PortfolioSummaryRow summary={portfolioSummary} />
              
              {portfolioSummary.nearestRepayment && (
                <UpcomingRepayment nearestRepayment={portfolioSummary.nearestRepayment} />
              )}
            </Space>
          )}

          {/* Performance Chart */}
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <SectionTitle level={3}>Performance Analytics</SectionTitle>
            <LoanMetricsChart 
              loans={loans} 
              btcPrice={btcPrice} 
              isLoading={isLoading} 
            />
          </Space>

          {/* Activity & Quick Actions */}
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <SectionTitle level={3}>Recent Activity</SectionTitle>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <RecentLoans loans={recentLoansSummary} />
              </Col>
              <Col xs={24} lg={12}>
                <QuickMetricsCard>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>Current BTC Price</Text>
                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                      {btcPrice ? btcPrice.toLocaleString() : 'N/A'} CZK
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Real-time market price
                    </Text>
                  </Space>
                </QuickMetricsCard>
              </Col>
            </Row>
          </Space>
        </Space>
      </DashboardContainer>
    </ErrorBoundary>
  );
};

export default Dashboard;
