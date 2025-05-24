import React, { useState, useEffect } from 'react';
import { Button, Typography, Table, Alert, Space, Spin } from 'antd';
import type { TableProps } from 'antd';
import { AuthState, useAuthStore } from '@store/authStore';
import { openSellOrder, cancelSellOrder, syncSellOrders } from '@services/exitStrategyService';
import { fetchSellOrdersForLoan } from '@services/loanService';
import type { components } from '@/api-types';

const statusLabels = [
  'Planned',
  'Submitted',
  'PartiallyFilled',
  'Completed',
  'Cancelled',
  'Failed',
];

type LoanWithOrders = components["schemas"]["LoanDto"];
type SellOrder = components["schemas"]["SellOrder"];

interface DataType extends SellOrder {
  key: React.Key;
}

type Props = {
  loan: LoanWithOrders;
  refresh: () => void;
};

export default function LoanDetailOrders({ loan, refresh }: Props) {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orders, setOrders] = useState<SellOrder[]>([]);

  useEffect(() => {
    if (!loan.id) return;
    setLoading(true);
    fetchSellOrdersForLoan(getAccessToken, loan.id)
      .then(setOrders)
      .catch(() => setError('Chyba při načítání orderů'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan.id, refresh]); 
// getAccessToken je ze store, neměl by způsobovat re-run, pokud se nezmění jeho instance, což by nemělo

  const handleOpen = async (orderId: number) => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      await openSellOrder(getAccessToken, orderId);
      setSuccess('Order byl nahrán na Coinmate');
      refresh();
    } catch {
      setError('Chyba při nahrávání orderu na Coinmate');
    } finally { setLoading(false); }
  };

  const handleCancel = async (orderId: number) => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      await cancelSellOrder(getAccessToken, orderId);
      setSuccess('Order byl zrušen na Coinmate');
      refresh();
    } catch {
      setError('Chyba při rušení orderu na Coinmate');
    } finally { setLoading(false); }
  };

  const handleSync = async () => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      await syncSellOrders(getAccessToken);
      setSuccess('Stavy orderů byly synchronizovány');
      refresh();
    } catch {
      setError('Chyba při synchronizaci orderů');
    } finally { setLoading(false); }
  };
  
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Coinmate ID',
      dataIndex: 'coinmateOrderId',
      key: 'coinmateOrderId',
      render: (id?: string | number | null) => id || '-', // id může být string, number, nebo null/undefined z API
    },
    {
      title: 'BTC množství',
      dataIndex: 'btcAmount',
      key: 'btcAmount',
      align: 'right',
      render: (amount?: number | null) => typeof amount === 'number' ? amount.toFixed(8) : 'N/A',
    },
    {
      title: 'Cena (CZK/BTC)',
      dataIndex: 'pricePerBtc',
      key: 'pricePerBtc',
      align: 'right',
      render: (price?: number | null) => typeof price === 'number' ? price.toLocaleString() : 'N/A',
    },
    {
      title: 'Celkem (CZK)',
      dataIndex: 'totalCzk',
      key: 'totalCzk',
      align: 'right',
      render: (total?: number | null) => typeof total === 'number' ? total.toLocaleString() : 'N/A',
    },
    {
      title: 'Stav',
      dataIndex: 'status',
      key: 'status',
      render: (status?: string | number | null) => { // status může být string nebo number z API
        const statusIndex = typeof status === 'string' ? statusLabels.indexOf(status) : (status as number);

        return statusLabels[statusIndex] || status;
      }
    },
    {
      title: 'Akce',
      key: 'action',
      render: (_: unknown, record: DataType) => (
        <Space size="middle">
          {record.status === 'Planned' && (
            <Button onClick={() => handleOpen(record.id!)} size="small" loading={loading} type="primary">
              Nahrát
            </Button>
          )}
          {record.status === 'Submitted' && (
            <Button onClick={() => handleCancel(record.id!)} size="small" loading={loading} danger>
              Stáhnout
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const dataSource: DataType[] = orders.map(o => ({ ...o, key: o.id! }));

  const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Failed');
  const totalBtcAmount = activeOrders.reduce((sum, order) => sum + (order.btcAmount || 0), 0);
  const totalCzkValue = activeOrders.reduce((sum, order) => sum + (order.totalCzk || 0), 0);
  const weightedAveragePrice = totalBtcAmount > 0 ? totalCzkValue / totalBtcAmount : 0;

  const tableFooter = () => (
    <Table.Summary fixed>
      <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
        <Table.Summary.Cell index={0} colSpan={1}>CELKEM (aktivní)</Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right">{totalBtcAmount.toFixed(8)}</Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right">
          {weightedAveragePrice > 0 ? weightedAveragePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align="right">
          {totalCzkValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} />
        <Table.Summary.Cell index={5} />
      </Table.Summary.Row>
    </Table.Summary>
  );

  if (loading && orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin tip="Načítám ordery..." size="large">
          <div style={{ minHeight: '100px' }} />
        </Spin>
      </div>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Typography.Title level={5} style={{ marginTop: '20px', marginBottom: 0 }}>Sell ordery k půjčce</Typography.Title>
      <Button onClick={handleSync} loading={loading} style={{ alignSelf: 'flex-start' }}>Synchronizovat stavy</Button>
      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />}
      {success && <Alert message={success} type="success" showIcon closable onClose={() => setSuccess(null)} />}
      
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        loading={loading && orders.length > 0}
        pagination={false}
        summary={orders.length > 0 ? tableFooter : undefined}
        bordered
        scroll={{ x: 'max-content' }} // Pro lepší zobrazení na menších obrazovkách
      />
    </Space>
  );
} 