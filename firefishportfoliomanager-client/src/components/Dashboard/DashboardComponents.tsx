import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Alert, Typography, Tag, Space, Row, Col, Statistic } from 'antd';
import { ClockCircleOutlined, EyeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { PortfolioSummary } from '../../types/portfolioTypes';

const { Title, Text } = Typography;

// Make sure this file is treated as a module
export {};

interface UpcomingRepaymentProps {
  nearestRepayment: NonNullable<PortfolioSummary['nearestRepayment']>;
}

export const UpcomingRepayment: React.FC<UpcomingRepaymentProps> = ({ nearestRepayment }) => (
  <Alert
    message="Upcoming Repayment"
    description={
      <Space direction="vertical" size={0}>
        <Text>
          Loan #{nearestRepayment.loanId} is due in {nearestRepayment.daysRemaining} days.
          <Text strong> Amount due: {nearestRepayment.amountCzk.toLocaleString()} CZK</Text>
        </Text>
        <Link to={`/loans/${nearestRepayment.loanId}`}>
          <Text type="warning" style={{ textDecoration: 'underline' }}>
            <EyeOutlined /> View Loan Details
          </Text>
        </Link>
      </Space>
    }
    type="warning"
    icon={<ClockCircleOutlined />}
    showIcon
    style={{ marginBottom: 24 }}
  />
);

interface RecentLoansProps {
  loans?: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

export const RecentLoans: React.FC<RecentLoansProps> = ({ loans = [] }) => {
  const columns = [
    {
      title: 'Loan ID',
      dataIndex: 'id',
      key: 'id',
      width: '20%',
      render: (id: string) => (
        <Text strong style={{ color: '#1890ff' }}>
          {id}
        </Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '25%',
      render: (date: string) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString('cs-CZ')}
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '30%',
      render: (amount: number) => (
        <Text strong>{amount.toLocaleString()} CZK</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '25%',
      render: (status: string) => (
        <Tag color="green" style={{ borderRadius: '12px' }}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <Card 
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>Recent Loans</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Last 3 loans
          </Text>
        </Space>
      }
      hoverable
      style={{ height: '100%' }}
      extra={
        <Link to="/loans">
          <Text style={{ fontSize: 14 }}>
            View All <ArrowRightOutlined />
          </Text>
        </Link>
      }
    >
      {loans.length > 0 ? (
        <Table
          columns={columns}
          dataSource={loans}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: true }}
          showHeader={false}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">No recent loans</Text>
        </div>
      )}
    </Card>
  );
};

interface PortfolioPerformanceProps {
  summary: PortfolioSummary;
}

export const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({ summary }) => {
  const currentValue = (summary.totalPurchasedBtc * summary.currentBtcPriceCzk);
  const profit = summary.profit || 0;
  const profitValueStyle = {
    color: profit >= 0 ? '#52c41a' : '#f5222d'
  };
  const profitSign = profit >= 0 ? '+' : '';
  
  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>Portfolio Performance</Title>}
      hoverable
    >
      <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Text type="secondary">Chart placeholder - portfolio performance over time</Text>
      </div>
      
      <Row gutter={16}>
        <Col span={12}>
          <Statistic 
            title="Current Value"
            value={currentValue}
            suffix="CZK"
            precision={0}
          />
        </Col>
        <Col span={12}>
          <Statistic 
            title="Profit"
            value={`${profitSign}${profit.toLocaleString()}`}
            suffix="CZK"
            valueStyle={profitValueStyle}
          />
        </Col>
      </Row>
    </Card>
  );
};
