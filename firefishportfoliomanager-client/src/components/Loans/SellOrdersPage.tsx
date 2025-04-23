import React, { useEffect, useState } from 'react';
import { Button, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Link, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { callApi } from '../../services/apiService';

interface SellOrderAgg {
  Id: number;
  LoanId: number;
  CoinmateOrderId: string;
  BtcAmount: number;
  PricePerBtc: number;
  TotalCzk: number;
  Status: number;
  CreatedAt: string;
  CompletedAt?: string | null;
  LoanReference: {
    Id: number;
    LoanId: string;
    LoanAmountCzk: number;
    RepaymentDate: string;
  };
}

const statusLabels = [
  'Planned',
  'Opened',
  'Partially Filled',
  'Filled',
  'Cancelled',
  'Failed',
];

export default function SellOrdersPage() {
  const { getAccessToken } = useAuth();
  const [orders, setOrders] = useState<SellOrderAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchOrders = () => {
    setLoading(true);
    let url = '/api/loans/sellorders/all';
    const params: string[] = [];
    if (statusFilter) params.push(`status=${statusFilter}`);
    if (sortBy) params.push(`sortBy=${sortBy}`);
    if (sortDir) params.push(`sortDir=${sortDir}`);
    if (params.length > 0) url += '?' + params.join('&');
    callApi<SellOrderAgg[]>(url, getAccessToken)
      .then(data => setOrders(data))
      .catch(() => setError('Chyba při načítání orderů'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [getAccessToken, statusFilter, sortBy, sortDir]);

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

  const getRowColor = (status: number) => {
    switch (status) {
      case 0: return '#e3f2fd'; // Planned - světle modrá
      case 1: return '#fffde7'; // Opened/Submitted - světle žlutá
      case 2: return '#ffe0b2'; // Partially Filled - světle oranžová
      case 3: return '#e8f5e9'; // Filled/Completed - světle zelená
      case 4: return '#ffebee'; // Cancelled - světle červená
      case 5: return '#ffebee'; // Failed - světle červená
      default: return 'white';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Agregovaný přehled všech sell orderů</Typography>
      <Box className="flex flex-wrap gap-4 mb-4">
        <FormControl size="small">
          <InputLabel id="status-label">Stav</InputLabel>
          <Select
            labelId="status-label"
            value={statusFilter}
            label="Stav"
            onChange={e => setStatusFilter(e.target.value)}
            style={{ minWidth: 120 }}
          >
            <MenuItem value="">Všechny</MenuItem>
            <MenuItem value="0">Planned</MenuItem>
            <MenuItem value="1">Opened</MenuItem>
            <MenuItem value="2">Partially Filled</MenuItem>
            <MenuItem value="3">Filled</MenuItem>
            <MenuItem value="4">Cancelled</MenuItem>
            <MenuItem value="5">Failed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="sortby-label">Řadit podle</InputLabel>
          <Select
            labelId="sortby-label"
            value={sortBy}
            label="Řadit podle"
            onChange={e => setSortBy(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <MenuItem value="">Cena (CZK/BTC)</MenuItem>
            <MenuItem value="createdAt">Datum vytvoření</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="sortdir-label">Směr</InputLabel>
          <Select
            labelId="sortdir-label"
            value={sortDir}
            label="Směr"
            onChange={e => setSortDir(e.target.value as 'asc' | 'desc')}
            style={{ minWidth: 100 }}
          >
            <MenuItem value="asc">Vzestupně</MenuItem>
            <MenuItem value="desc">Sestupně</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && (
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Order č.</TableCell>
                <TableCell>Coinmate ID</TableCell>
                <TableCell>BTC množství</TableCell>
                <TableCell>Cena (CZK/BTC)</TableCell>
                <TableCell>Celkem (CZK)</TableCell>
                <TableCell>Stav</TableCell>
                <TableCell>Datum vytvoření</TableCell>
                <TableCell>Příslušná půjčka</TableCell>
                <TableCell>Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order, idx) => (
                <TableRow key={order.Id} style={{ background: getRowColor(order.Status) }}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{order.CoinmateOrderId || '-'}</TableCell>
                  <TableCell>{order.BtcAmount.toFixed(8)}</TableCell>
                  <TableCell>{order.PricePerBtc.toLocaleString()}</TableCell>
                  <TableCell>{order.TotalCzk.toLocaleString()}</TableCell>
                  <TableCell>{statusLabels[order.Status] || order.Status}</TableCell>
                  <TableCell>{order.CreatedAt ? new Date(order.CreatedAt).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Link href={`/loans/${order.LoanReference.Id}`}>{order.LoanReference.LoanId}</Link><br/>
                    {order.LoanReference.LoanAmountCzk.toLocaleString()} CZK<br/>
                    Splatnost: {order.LoanReference.RepaymentDate}
                  </TableCell>
                  <TableCell>
                    {order.Status === 0 && (
                      <Button size="small" variant="contained" color="primary" onClick={() => handleOpenOrder(order.Id)} disabled={loading}>
                        Otevřít
                      </Button>
                    )}
                    {order.Status === 1 && (
                      <Button size="small" variant="outlined" color="secondary" onClick={() => handleCancelOrder(order.Id)} disabled={loading}>
                        Zrušit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
} 