import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Tag,
  Descriptions,
  Statistic,
  Spin,
  Alert,
  Divider,
  Progress,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  WalletOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { Loan, SellOrder } from '../../types/loanTypes';
import { fetchLoanById } from '../../services/loanService';
import { useAuthStore, AuthState } from '@store/authStore';
import { fetchInternalBtcPrice } from '../../services/userService';
import { statusDisplay, formatCurrency, formatPercentage } from '../../utils/loanUtils';
import LoanDetailOrders from './LoanDetailOrders';

const { Title, Text } = Typography;

const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLoanDetail = async () => {
      if (!id) {
        setError('Chybí ID půjčky');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error('Neplatné ID půjčky');
        }

        const [loanData, btcPriceData] = await Promise.all([
          fetchLoanById(getAccessToken, numericId),
          fetchInternalBtcPrice(getAccessToken)
        ]);

        setLoan(loanData);
        setBtcPrice(btcPriceData.priceCzk || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nepodařilo se načíst detail půjčky';
        setError(message);
        console.error('Error loading loan detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoanDetail();
  }, [id, getAccessToken]);

  const refreshLoan = async () => {
    if (!id || !loan) return;
    
    try {
      const numericId = parseInt(id, 10);
      const updatedLoan = await fetchLoanById(getAccessToken, numericId);
      setLoan(updatedLoan);
    } catch (err) {
      console.error('Error refreshing loan:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Načítám detail půjčky...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Chyba při načítání"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/loans')}>
              Zpět na půjčky
            </Button>
          }
        />
      </div>
    );
  }

  if (!loan) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Půjčka nenalezena"
          description="Požadovaná půjčka nebyla nalezena"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/loans')}>
              Zpět na půjčky
            </Button>
          }
        />
      </div>
    );
  }

  // Calculate metrics
  const sellOrders = (loan.sellOrders as SellOrder[]) || [];
  const realized = sellOrders.filter((o: SellOrder) => o.status === 'Completed');
  const realizedBtc = realized.reduce((sum: number, o: SellOrder) => sum + (o.btcAmount || 0), 0);
  const realizedCzk = realized.reduce((sum: number, o: SellOrder) => sum + ((o.btcAmount || 0) * (o.pricePerBtc || 0)), 0);
  const boughtBtc = (loan.purchasedBtc || 0) - (loan.feesBtc || 0) - (loan.transactionFeesBtc || 0);
  const remainingBtc = boughtBtc - realizedBtc;
  const currentValue = (remainingBtc * (btcPrice || 0)) + realizedCzk;
  const currentProfit = loan.repaymentAmountCzk ? ((currentValue / loan.repaymentAmountCzk) - 1) * 100 : 0;

  // Days calculation
  const today = new Date();
  const repaymentDate = new Date(loan.repaymentDate);
  const loanDate = new Date(loan.loanDate);
  const daysLeft = Math.ceil((repaymentDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const totalDays = Math.ceil((repaymentDate.getTime() - loanDate.getTime()) / (1000 * 3600 * 24));
  const daysElapsed = totalDays - daysLeft;
  const progressPercent = totalDays > 0 ? Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100)) : 0;

  const isUrgent = daysLeft <= 7;
  const isPastDue = daysLeft < 0;

  const displayStatus = statusDisplay[loan.status as keyof typeof statusDisplay] || 
                       { text: 'Neznámý', color: '#d9d9d9' };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/loans')}
            >
              Zpět na půjčky
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Detail půjčky #{loan.loanId}
            </Title>
            <Tag color={loan.status === 'Active' ? 'green' : 'default'}>
              {displayStatus.text}
            </Tag>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={() => navigate(`/loans/${loan.id}/edit`)}
            >
              Upravit
            </Button>
            <Button 
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => navigate(`/loans/${loan.id}/sell-strategy`)}
            >
              Prodejní strategie
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Quick Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Půjčená částka"
              value={loan.loanAmountCzk}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="K splacení"
              value={loan.repaymentAmountCzk}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Současná hodnota"
              value={currentValue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<WalletOutlined />}
              valueStyle={{ color: currentProfit >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(2)}% zisk/ztráta
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={isPastDue ? 'Po termínu' : 'Zbývá dní'}
              value={Math.abs(daysLeft)}
              suffix="dní"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: isPastDue ? '#ff4d4f' : isUrgent ? '#faad14' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Bar */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Průběh splatnosti</Text>
            <Text type="secondary">
              {daysElapsed} / {totalDays} dní
            </Text>
          </div>
          <Progress 
            percent={progressPercent} 
            status={isPastDue ? 'exception' : isUrgent ? 'active' : 'normal'}
            strokeColor={
              isPastDue ? '#ff4d4f' : 
              isUrgent ? '#faad14' : 
              progressPercent > 75 ? '#faad14' : '#52c41a'
            }
          />
          <Row justify="space-between">
            <Text type="secondary">
              Půjčeno: {new Date(loan.loanDate).toLocaleDateString('cs-CZ')}
            </Text>
            <Text type="secondary">
              Splatnost: {new Date(loan.repaymentDate).toLocaleDateString('cs-CZ')}
            </Text>
          </Row>
        </Space>
      </Card>

      <Row gutter={24}>
        {/* Left Column - Basic Info */}
        <Col xs={24} lg={12}>
          <Card title="Základní informace" style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID půjčky">
                <Text strong>{loan.loanId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Datum půjčky">
                {new Date(loan.loanDate).toLocaleDateString('cs-CZ')}
              </Descriptions.Item>
              <Descriptions.Item label="Doba splatnosti">
                {loan.loanPeriodMonths} měsíců
              </Descriptions.Item>
              <Descriptions.Item label="Datum splacení">
                {new Date(loan.repaymentDate).toLocaleDateString('cs-CZ')}
              </Descriptions.Item>
              <Descriptions.Item label="Úroková sazba">
                {loan.interestRate}%
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={loan.status === 'Active' ? 'green' : 'default'}>
                  {displayStatus.text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Financial Details */}
          <Card title="Finanční detaily">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Půjčená částka">
                <Text strong>{formatCurrency(loan.loanAmountCzk)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Úroky">
                <Text>{formatCurrency(loan.repaymentAmountCzk - loan.loanAmountCzk)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Celkem k splacení">
                <Text strong style={{ color: '#faad14' }}>
                  {formatCurrency(loan.repaymentAmountCzk)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Realizováno">
                <Text style={{ color: '#52c41a' }}>
                  {formatCurrency(realizedCzk)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Současná hodnota">
                <Text strong style={{ color: currentProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {formatCurrency(currentValue)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Zisk/Ztráta">
                <Text strong style={{ color: currentProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(2)}%
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Right Column - Bitcoin Details */}
        <Col xs={24} lg={12}>
          <Card title="Bitcoin transakce" style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Celkem odesláno">
                <Text>{(loan.totalSentBtc || 0).toFixed(8)} ₿</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Nakoupeno">
                <Text>{(loan.purchasedBtc || 0).toFixed(8)} ₿</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Poplatky">
                <Text type="secondary">
                  {(loan.feesBtc || 0).toFixed(8)} ₿
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Transakční poplatky">
                <Text type="secondary">
                  {(loan.transactionFeesBtc || 0).toFixed(8)} ₿
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kolaterál">
                <Text>{(loan.collateralBtc || 0).toFixed(8)} ₿</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Efektivně investováno">
                <Text strong>{boughtBtc.toFixed(8)} ₿</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Realizováno">
                <Text style={{ color: '#52c41a' }}>
                  {realizedBtc.toFixed(8)} ₿
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Zbývá">
                <Text strong>{remainingBtc.toFixed(8)} ₿</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* BTC Price Info */}
          {btcPrice && (
            <Card title="Aktuální BTC cena">
              <Statistic
                value={btcPrice}
                formatter={(value) => formatCurrency(Number(value))}
                suffix="CZK"
                prefix={<CalculatorOutlined />}
                valueStyle={{ color: '#f7931e' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Zbývající BTC hodnota: {formatCurrency(remainingBtc * btcPrice)}
              </Text>
            </Card>
          )}
        </Col>
      </Row>

      {/* Sell Orders Section */}
      <Divider />
      <LoanDetailOrders loan={loan} refresh={refreshLoan} />
    </div>
  );
};

export default LoanDetailPage; 