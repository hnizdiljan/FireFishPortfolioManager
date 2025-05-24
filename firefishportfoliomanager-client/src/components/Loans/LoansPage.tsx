import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  Tooltip,
  Row,
  Col,
  Statistic,
  Alert,
  Modal,
  Badge,
  Progress,
  Spin,
  Empty,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CalendarOutlined,
  DollarOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Loan, ExitStrategy, SellOrder } from '../../types';
import { useLoansDetails } from '../../hooks/useLoans';
import { statusDisplay, formatCurrency, formatPercentage } from '../../utils/loanUtils';

const { Title, Text } = Typography;
const { confirm } = Modal;

type LoanWithDetails = Loan & { 
  exitStrategy: ExitStrategy | null;
  sellOrders?: SellOrder[];
  potentialValueCzk?: number;
};

const getDaysLeft = (repaymentDate: string) => {
  const today = new Date();
  const repay = new Date(repaymentDate);

  return Math.ceil((repay.getTime() - today.getTime()) / (1000 * 3600 * 24));
};

const formatValueProfit = (value: number, profit: number) => {
  const profitColor = profit < 0 ? '#ff4d4f' : profit > 0 ? '#52c41a' : '#8c8c8c';
  const ProfitIcon = profit > 0 ? RiseOutlined : profit < 0 ? FallOutlined : null;
  
  return (
    <Space direction="vertical" size={0}>
      <Text strong>{formatCurrency(value)}</Text>
      <Text style={{ color: profitColor, fontSize: '12px' }}>
        {ProfitIcon && <ProfitIcon />} {profit > 0 ? '+' : ''}{formatPercentage(profit)}
      </Text>
    </Space>
  );
};

const getExitStrategyDisplay = (loan: LoanWithDetails) => {
  if (!loan.exitStrategy || !loan.exitStrategy.type) {
    return <Tag color="default">Není nastaveno</Tag>;
  }

  const { type } = loan.exitStrategy;
  let color = 'blue';
  let displayName: string = type;
  
  if (type === 'CustomLadder') {
    color = 'green';
    displayName = 'Custom Ladder';
  } else if (type === 'SmartDistribution') {
    color = 'purple';
    displayName = 'Smart Distribution';
  } else if (type === 'HODL') {
    color = 'gold';
    displayName = 'HODL';
  }

  const total = loan.exitStrategy.type === 'CustomLadder' && 'orders' in loan.exitStrategy 
    ? loan.exitStrategy.orders?.length || 0
    : loan.exitStrategy.type === 'SmartDistribution' && 'orderCount' in loan.exitStrategy
    ? loan.exitStrategy.orderCount || 0
    : 0;
  
  let realized = 0;
  if (loan.sellOrders) {
    realized = loan.sellOrders.filter((o: SellOrder) => o.status === 'Completed').length;
  }

  const progressPercent = total > 0 ? (realized / total) * 100 : 0;

  return (
    <Space direction="vertical" size={4}>
      <Tag color={color}>{displayName}</Tag>
      {total > 0 && (
        <div style={{ width: '100px' }}>
          <Progress 
            percent={progressPercent} 
            size="small" 
            format={() => `${realized}/${total}`}
            strokeColor={color === 'green' ? '#52c41a' : color === 'purple' ? '#722ed1' : '#1890ff'}
          />
        </div>
      )}
    </Space>
  );
};

const LoansPage: React.FC = () => {
  const { loansDetails, btcPrice, isLoading, error, removeLoan } = useLoansDetails();
  const navigate = useNavigate();
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const handleDelete = async (loan: LoanWithDetails) => {
    confirm({
      title: 'Smazat půjčku',
      icon: <ExclamationCircleOutlined />,
      content: `Opravdu chcete smazat půjčku #${loan.loanId}? Tuto akci nelze vrátit zpět.`,
      okText: 'Smazat',
      okType: 'danger',
      cancelText: 'Zrušit',
      async onOk() {
        setDeleteLoading(loan.id!);
        try {
          await removeLoan(loan.id!);
          message.success(`Půjčka #${loan.loanId} byla úspěšně smazána`);
        } catch (error) {
          console.error('Error deleting loan:', error);
          message.error('Nepodařilo se smazat půjčku. Zkuste to prosím znovu.');
        } finally {
          setDeleteLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      title: 'Půjčka',
      key: 'loanInfo',
      width: 120,
      render: (record: LoanWithDetails) => (
        <Space direction="vertical" size={0}>
          <Text strong>#{record.loanId}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Částka',
      key: 'amount',
      width: 140,
      render: (record: LoanWithDetails) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatCurrency(record.loanAmountCzk)}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Splatit: {formatCurrency(record.repaymentAmountCzk)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Datum splacení',
      key: 'repaymentDate',
      width: 140,
      render: (record: LoanWithDetails) => {
        const daysLeft = getDaysLeft(record.repaymentDate);
        const isUrgent = daysLeft <= 7;
        const isPastDue = daysLeft < 0;
        
        return (
          <Space direction="vertical" size={0}>
            <Text>{new Date(record.repaymentDate).toLocaleDateString('cs-CZ')}</Text>
            <Badge 
              count={isPastDue ? 'Po termínu' : `${daysLeft} dní`}
              style={{ 
                backgroundColor: isPastDue ? '#ff4d4f' : isUrgent ? '#faad14' : '#52c41a',
                fontSize: '10px'
              }}
            />
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const displayStatus = statusDisplay[status as keyof typeof statusDisplay] || 
                             { text: 'Neznámý', color: '#d9d9d9' };

        return (
          <Tag color={status === 'Active' ? 'green' : 'default'}>
            {displayStatus.text}
          </Tag>
        );
      },
    },
    {
      title: 'Současná hodnota',
      key: 'currentValue',
      width: 140,
      render: (record: LoanWithDetails) => {
        const sellOrders = record.sellOrders || [];
        const realized = sellOrders.filter((o: SellOrder) => o.status === 'Completed');
        const realizedBtc = realized.reduce((sum: number, o: SellOrder) => sum + (o.btcAmount || 0), 0);
        const realizedCzk = realized.reduce((sum: number, o: SellOrder) => sum + ((o.btcAmount || 0) * (o.pricePerBtc || 0)), 0);
        const boughtBtc = (record.purchasedBtc || 0) - (record.feesBtc || 0) - (record.transactionFeesBtc || 0);
        const currentValue = ((boughtBtc - realizedBtc) * (btcPrice || 0)) + realizedCzk;
        const currentProfit = record.repaymentAmountCzk ? ((currentValue / record.repaymentAmountCzk) - 1) * 100 : 0;
        
        return formatValueProfit(currentValue, currentProfit);
      },
    },
    {
      title: 'Potenciální hodnota',
      key: 'potentialValue',
      width: 140,
      render: (record: LoanWithDetails) => {
        // Používáme backend hodnotu s nejvyšší cenou z SELL orderů pro zbývající BTC
        // V detail view (SellStrategyPage) může uživatel simulovat jinou cenu
        const backendPotentialValueCzk = record.potentialValueCzk || 0;
        const potentialProfit = record.repaymentAmountCzk && record.repaymentAmountCzk > 0
          ? ((backendPotentialValueCzk / record.repaymentAmountCzk) - 1) * 100
          : 0;
        
        return formatValueProfit(backendPotentialValueCzk, potentialProfit);
      },
    },
    {
      title: 'Exit strategie',
      key: 'exitStrategy',
      width: 140,
      render: (record: LoanWithDetails) => {
        return (
          <div style={{ position: 'relative' }}>
            {getExitStrategyDisplay(record)}
            
            {/* Actions overlay positioned relative to this cell */}
            <div 
              className={`row-actions-overlay ${hoveredRowId === String(record.id) ? 'visible' : 'hidden'}`}
              style={{
                position: 'absolute',
                right: '-16px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '16px',
                paddingLeft: '40px',
                background: 'linear-gradient(to left, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 70%, transparent 100%)',
                backdropFilter: 'blur(2px)',
                zIndex: 10,
                height: '40px',
                minWidth: '140px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                pointerEvents: hoveredRowId === String(record.id) ? 'auto' : 'none',
                opacity: hoveredRowId === String(record.id) ? 1 : 0,
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={() => setHoveredRowId(String(record.id))}
              onMouseLeave={() => setHoveredRowId(null)}
            >
              <Space size="small">
                <Tooltip title="Upravit půjčku">
                  <Button 
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/loans/${record.id}/edit`)}
                    style={{ 
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #d9d9d9',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                </Tooltip>
                <Tooltip title="Nastavit strategii">
                  <Button 
                    type="text"
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => navigate(`/loans/${record.id}/sell-strategy`)}
                    style={{ 
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #d9d9d9',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                </Tooltip>
                <Tooltip title="Smazat půjčku">
                  <Button 
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteLoading === record.id}
                    onClick={() => handleDelete(record)}
                    style={{ 
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #ffccc7',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                </Tooltip>
              </Space>
            </div>
          </div>
        );
      },
    },
  ];

  // Calculate summary statistics
  const totalLoansValue = loansDetails.reduce((sum, loan) => sum + (loan.loanAmountCzk || 0), 0);
  const totalRepaymentValue = loansDetails.reduce((sum, loan) => sum + (loan.repaymentAmountCzk || 0), 0);
  const activeLoansCount = loansDetails.filter(loan => loan.status === 'Active').length;

  // Calculate current value of active loans
  const activeLoansCurrentValue = loansDetails
    .filter(loan => loan.status === 'Active')
    .reduce((sum, loan) => {
      const sellOrders = (loan as LoanWithDetails).sellOrders || [];
      const realized = sellOrders.filter((o: SellOrder) => o.status === 'Completed');
      const realizedBtc = realized.reduce((acc: number, o: SellOrder) => acc + (o.btcAmount || 0), 0);
      const realizedCzk = realized.reduce((acc: number, o: SellOrder) => acc + ((o.btcAmount || 0) * (o.pricePerBtc || 0)), 0);
      const boughtBtc = (loan.purchasedBtc || 0) - (loan.feesBtc || 0) - (loan.transactionFeesBtc || 0);
      const currentValue = ((boughtBtc - realizedBtc) * (btcPrice || 0)) + realizedCzk;

      return sum + currentValue;
    }, 0);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Načítám půjčky...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <DollarOutlined /> Moje půjčky
          </Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/loans/new')}
          >
            Přidat půjčku
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Celková hodnota půjček"
              value={totalLoansValue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="K splacení celkem"
              value={totalRepaymentValue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Současná hodnota aktivních"
              value={activeLoansCurrentValue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Aktivní půjčky"
              value={activeLoansCount}
              suffix={`/ ${loansDetails.length}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Chyba při načítání"
          description={error}
          type="error"
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      {/* Main Content */}
      <Card>
        {loansDetails.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Zatím nemáte žádné půjčky"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/loans/new')}>
              Přidat první půjčku
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={loansDetails}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} z ${total} půjček`,
            }}
            rowClassName={(record) => {
              const daysLeft = getDaysLeft(record.repaymentDate);
              if (daysLeft < 0) return 'row-past-due';
              if (daysLeft <= 7) return 'row-urgent';

              return '';
            }}
            onRow={(record) => ({
              onMouseEnter: () => setHoveredRowId(String(record.id)),
              onMouseLeave: () => setHoveredRowId(null),
            })}
          />
        )}
      </Card>

      {/* Custom Styles */}
      <style>{`
        .row-past-due td {
          background-color: #fff2f0 !important;
        }
        .row-urgent td {
          background-color: #fffbf0 !important;
        }
        .ant-table-tbody > tr:hover.row-past-due > td {
          background-color: #ffece6 !important;
        }
        .ant-table-tbody > tr:hover.row-urgent > td {
          background-color: #fff7e6 !important;
        }
        
        /* Smooth row hover transitions */
        .ant-table-tbody > tr {
          transition: all 0.2s ease-in-out;
        }
        
        .ant-table-tbody > tr:hover {
          background-color: #fafafa;
          transform: translateX(-2px);
          box-shadow: 2px 0 8px rgba(0,0,0,0.1);
        }
        
        /* Actions overlay styles */
        .row-actions-overlay.hidden {
          opacity: 0;
          transform: translateY(-50%) translateX(10px);
          pointer-events: none;
        }
        
        .row-actions-overlay.visible {
          opacity: 1;
          transform: translateY(-50%) translateX(0px);
          pointer-events: auto;
        }
        
        /* Prevent table cell overflow */
        .ant-table-tbody > tr > td:last-child {
          overflow: visible !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .row-actions-overlay {
            min-width: 100px !important;
            padding-left: 20px !important;
          }
          
          .row-actions-overlay .ant-space {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default LoansPage;