import React from 'react';
import { PortfolioSummaryRow } from './PortfolioSummaryComponents';
import { UpcomingRepayment, RecentLoans } from './DashboardComponents';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import { AuthState, useAuthStore } from '@store/authStore';
import { useDashboardData } from '@hooks/useDashboardData';
import { statusDisplay } from '@utils/loanUtils';
import { usePortfolioSummary } from '@hooks/usePortfolioSummary';
import type { Loan } from '@/types/loanTypes';
import { Row, Col, Card, Typography, Divider } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
`;

const StatCard = styled(Card)`
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmountCzk, 0);
  const totalRepaymentAmount = activeLoans.reduce((sum, loan) => sum + loan.repaymentAmountCzk, 0);
  const totalCollateralBtc = activeLoans.reduce((sum, loan) => sum + loan.collateralBtc, 0);
  const totalPurchasedBtc = activeLoans.reduce((sum, loan) => sum + (loan.purchasedBtc ?? 0), 0);
  const collateralValue = btcPrice ? totalCollateralBtc * btcPrice : 0;
  const purchasedValue = btcPrice ? totalPurchasedBtc * btcPrice : 0;
  const nextRepayment = activeLoans.length > 0 
    ? activeLoans.reduce((earliest, current) => 
        new Date(current.repaymentDate) < new Date(earliest.repaymentDate) ? current : earliest
      )
    : null;

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
        <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>
        <Text type="secondary" style={{ fontSize: 18, marginBottom: 32, display: 'block' }}>
          Welcome back, {userName || user?.name || 'User'}!
        </Text>

        {error && (
          <Card style={{ background: '#fff1f0', borderColor: '#ffa39e', marginBottom: 24 }}>
            <Text type="danger"><b>Error!</b> {error}</Text>
          </Card>
        )}

        {portfolioSummary && (
          <>
            <PortfolioSummaryRow summary={portfolioSummary} />
            
            {portfolioSummary.nearestRepayment && (
              <UpcomingRepayment nearestRepayment={portfolioSummary.nearestRepayment} />
            )}
            
            <Divider />
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} md={12}>
                <RecentLoans loans={recentLoansSummary} />
              </Col>
            </Row>
          </>
        )}

        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} md={8}>
            <StatCard>
              <Text type="secondary">Total Active Loaned</Text>
              <Title level={3}>{totalLoanAmount.toLocaleString()} CZK</Title>
              <Text type="secondary">({activeLoans.length} active loans)</Text>
            </StatCard>
          </Col>
          <Col xs={24} md={8}>
            <StatCard>
              <Text type="secondary">Total Repayment Due (Active)</Text>
              <Title level={3}>{totalRepaymentAmount.toLocaleString()} CZK</Title>
            </StatCard>
          </Col>
          <Col xs={24} md={8}>
            <StatCard>
              <Text type="secondary">Next Repayment Due</Text>
              {nextRepayment ? (
                <>
                  <Title level={3}>{new Date(nextRepayment.repaymentDate).toLocaleDateString()}</Title>
                  <Text type="secondary">({nextRepayment.loanId} - {nextRepayment.repaymentAmountCzk.toLocaleString()} CZK)</Text>
                </>
              ) : (
                <Text type="secondary">N/A</Text>
              )}
            </StatCard>
          </Col>
          <Col xs={24} md={8}>
            <StatCard>
              <Text type="secondary">Total Collateral (Active)</Text>
              <Title level={3}>{totalCollateralBtc.toFixed(4)} BTC</Title>
              <Text type="secondary">≈ {collateralValue.toLocaleString()} CZK</Text>
            </StatCard>
          </Col>
          <Col xs={24} md={8}>
            <StatCard>
              <Text type="secondary">Total Purchased (Active Loans)</Text>
              <Title level={3}>{totalPurchasedBtc.toFixed(4)} BTC</Title>
              <Text type="secondary">≈ {purchasedValue.toLocaleString()} CZK</Text>
            </StatCard>
          </Col>
          <Col xs={24} md={8}>
            <StatCard>
              <Text type="secondary">Current BTC Price</Text>
              <Title level={3}>{btcPrice ? btcPrice.toLocaleString() : 'N/A'} CZK</Title>
            </StatCard>
          </Col>
        </Row>
      </DashboardContainer>
    </ErrorBoundary>
  );
};

export default Dashboard;
