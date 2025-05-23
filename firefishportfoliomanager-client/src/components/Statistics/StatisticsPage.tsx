import React from 'react';
// import { useStatisticsService } from '../../services/statisticsService'; // Path will be updated by Prettier
import { useStatisticsService } from '@services/statisticsService'; // Corrected path alias
import { 
  Typography, 
  Spin, 
  Alert, 
  Card, 
  Row, 
  Col
} from 'antd';
import styled from 'styled-components';
import PortfolioChart from './PortfolioChart'; 
// import type { ChartData, StatisticsSummary } from '@services/statisticsService'; // Types are inferred or part of hook return

const PageContainer = styled.div`
  padding: 24px;
  margin: auto;
  max-width: 1200px; // Adjusted for potentially wider content like charts
`;

const StatisticCard = styled(Card)`
  height: 100%; // Ensure cards in a row have the same height if content varies
`;

const CenteredSpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
`;

const ChartContainer = styled.div`
  height: 350px; // Increased height for better chart visibility
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9; // Ant Design standard border color
  border-radius: 8px; // Ant Design standard border radius
  padding: 16px;
`;

const StatisticsPage: React.FC = () => {
  const { statisticsSummary, chartData, isLoading, error } = useStatisticsService();

  if (isLoading) {
    return (
      <CenteredSpinnerContainer>
        <Spin size="large" tip="Načítám statistiky...">
          <div style={{ minHeight: '200px' }} />
        </Spin>
      </CenteredSpinnerContainer>
    );
  }

  return (
    <PageContainer>
      <Typography.Title level={2} style={{ marginBottom: '24px' }}>
        Statistiky portfolia
      </Typography.Title>

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: '24px' }} />
      )}

      {statisticsSummary && (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <StatisticCard title="Celkem půjček">
              <Typography.Title level={3}>{statisticsSummary.totalLoans}</Typography.Title>
              <Typography.Text type="secondary">
                Aktivní: {statisticsSummary.activeLoansCzk.toLocaleString()} CZK
              </Typography.Text>
            </StatisticCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <StatisticCard title="Nakoupeno BTC">
              <Typography.Title level={3}>{statisticsSummary.totalBtcPurchased.toFixed(4)} BTC</Typography.Title>
              <Typography.Text type="secondary">
                Zbývá: {statisticsSummary.totalBtcRemaining.toFixed(4)} BTC
              </Typography.Text>
            </StatisticCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <StatisticCard title="Celkový zisk">
              <Typography.Title level={3} style={{ color: '#52c41a' /* Ant Design Green 6 */ }}>
                {statisticsSummary.totalProfitCzk.toLocaleString()} CZK
              </Typography.Title>
              <Typography.Text type="secondary">
                Prům. návratnost: {statisticsSummary.averageProfitPercentage}%
              </Typography.Text>
            </StatisticCard>
          </Col>
        </Row>
      )}
      
      <Card title="Růst portfolia">
        {chartData && chartData.labels && chartData.labels.length > 0 ? (
          <PortfolioChart data={chartData} />
        ) : (
          <ChartContainer>
             <Typography.Text type="secondary">
               {isLoading ? 'Načítám data grafu...' : 'Pro graf nejsou k dispozici žádná data.'}
             </Typography.Text>
          </ChartContainer>
        )}
      </Card>
      
    </PageContainer>
  );
};

export default StatisticsPage;
