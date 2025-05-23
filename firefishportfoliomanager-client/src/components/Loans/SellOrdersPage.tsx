import React, { useEffect, useState } from 'react';
import { Button, Typography, Table, Select, Space, Alert, Tag } from 'antd';
import type { TableProps } from 'antd';
import { Link as RouterLink } from 'react-router-dom';
import { AuthState, useAuthStore } from '@store/authStore';
import { callApi } from '@services/apiService';
import { SellOrderAggDto, SellOrderStatus } from '@/types';

const statusLabels = [
  'Planned',
  'Submitted', 
  'PartiallyFilled',
  'Completed',
  'Cancelled',
  'Failed',
];

interface DataType extends SellOrderAggDto {
  key: React.Key;
}

const { Option } = Select;

export default function SellOrdersPage() {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  const [orders, setOrders] = useState<SellOrderAggDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('pricePerBtc');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchOrders = React.useCallback(() => {
    setLoading(true);
    setError(null);
    let url = '/api/loans/sellorders/all';
    const params: string[] = [];
    if (statusFilter) params.push(`status=${statusFilter}`);
    if (sortBy) params.push(`sortBy=${sortBy}`);
    if (sortDir) params.push(`sortDir=${sortDir}`);
    if (params.length > 0) url += '?' + params.join('&');
    callApi<SellOrderAggDto[]>(url, getAccessToken)
      .then(data => setOrders(data))
      .catch(() => setError('Chyba při načítání orderů'))
      .finally(() => setLoading(false));
  }, [getAccessToken, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenOrder = async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      await callApi(`/api/loans/sellorders/${orderId}/open`, getAccessToken, { method: 'POST' });
      fetchOrders();
    } catch {
      setError('Chyba při otevírání orderu');
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      await callApi(`/api/loans/sellorders/${orderId}/cancel`, getAccessToken, { method: 'POST' });
      fetchOrders();
    } catch {
      setError('Chyba při rušení orderu');
      setLoading(false);
    }
  };

  const getStatusTagColor = (status: SellOrderStatus) => {
    switch (status) {
      case 'Planned': return 'processing';
      case 'Submitted': return 'warning';
      case 'PartiallyFilled': return 'orange';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };
  
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Order č.',
      key: 'orderNumber',
      render: (_: unknown, __: DataType, index: number) => index + 1,
    },
    {
      title: 'Coinmate ID',
      dataIndex: 'coinmateOrderId',
      key: 'coinmateOrderId',
      render: (id?: string | null) => id || '-',
    },
    {
      title: 'BTC množství',
      dataIndex: 'btcAmount',
      key: 'btcAmount',
      align: 'right',
      render: (amount: number) => amount?.toFixed(8),
    },
    {
      title: 'Cena (CZK/BTC)',
      dataIndex: 'pricePerBtc',
      key: 'pricePerBtc',
      align: 'right',
      render: (price: number) => price?.toLocaleString(),
    },
    {
      title: 'Celkem (CZK)',
      dataIndex: 'totalCzk',
      key: 'totalCzk',
      align: 'right',
      render: (total: number) => total?.toLocaleString(),
    },
    {
      title: 'Stav',
      dataIndex: 'status',
      key: 'status',
      render: (status: SellOrderStatus) => (
        <Tag color={getStatusTagColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Datum vytvoření',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Příslušná půjčka',
      dataIndex: 'loanReference',
      key: 'loanReference',
      render: (loanRef: SellOrderAggDto['loanReference']) => (
        <Space direction="vertical" size={2}>
          <RouterLink to={`/loans/${loanRef.id}`}>{loanRef.loanId}</RouterLink>
          <Typography.Text style={{fontSize: '12px'}}>{loanRef.loanAmountCzk.toLocaleString()} CZK</Typography.Text>
          <Typography.Text style={{fontSize: '12px'}}>Splatnost: {new Date(loanRef.repaymentDate).toLocaleDateString()}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Akce',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_: unknown, record: DataType) => (
        <Space size="small">
          {record.status === 'Planned' && (
            <Button onClick={() => handleOpenOrder(record.id)} size="small" type="primary" loading={loading}>
              Otevřít
            </Button>
          )}
          {record.status === 'Submitted' && (
            <Button onClick={() => handleCancelOrder(record.id)} size="small" danger loading={loading}>
              Zrušit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const dataSource: DataType[] = orders.map(o => ({ ...o, key: o.id }));
  
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Typography.Title level={4} style={{ marginTop: '20px', marginBottom: 0 }}>
        Agregovaný přehled všech sell orderů
      </Typography.Title>
      
      <Space wrap size="middle" style={{ marginBottom: '16px' }}>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ minWidth: 180 }}
          placeholder="Filtrovat podle stavu"
          allowClear
        >
          <Option value="">Všechny stavy</Option>
          {statusLabels.map((label, index) => (
            <Option key={index} value={label}>{label}</Option>
          ))}
        </Select>
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ minWidth: 200 }}
          placeholder="Řadit podle"
        >
          <Option value="pricePerBtc">Cena (CZK/BTC)</Option>
          <Option value="createdAt">Datum vytvoření</Option>
          <Option value="btcAmount">Množství BTC</Option>
          <Option value="totalCzk">Celkem CZK</Option>
        </Select>
        <Select
          value={sortDir}
          onChange={(value: 'asc' | 'desc') => setSortDir(value)}
          style={{ minWidth: 120 }}
        >
          <Option value="asc">Vzestupně</Option>
          <Option value="desc">Sestupně</Option>
        </Select>
        <Button onClick={fetchOrders} loading={loading}>Obnovit</Button>
      </Space>

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{marginBottom: '16px'}}/>}
      
      <Table<DataType>
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        size="small"
        bordered
        scroll={{ x: 'max-content' }} 
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
      />
    </Space>
  );
} 