import React, { useState } from 'react';
import { Button, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { openSellOrder, cancelSellOrder, syncSellOrders } from '../../services/exitStrategyService';
import type { components } from '../../api-types';

const statusLabels = [
  'Planned',
  'Submitted',
  'PartiallyFilled',
  'Completed',
  'Cancelled',
  'Failed',
];

type LoanWithOrders = components["schemas"]["Loan"];
type SellOrder = components["schemas"]["SellOrder"];

type Props = {
  loan: LoanWithOrders;
  refresh: () => void;
};

export default function LoanDetailOrders({ loan, refresh }: Props) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const orders = loan.sellOrders;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Sell ordery k půjčce</Typography>
      <Button onClick={handleSync} variant="outlined" sx={{ mb: 2 }} disabled={loading}>Synchronizovat stavy</Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Coinmate ID</TableCell>
            <TableCell>BTC množství</TableCell>
            <TableCell>Cena (CZK/BTC)</TableCell>
            <TableCell>Celkem (CZK)</TableCell>
            <TableCell>Stav</TableCell>
            <TableCell>Akce</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order: SellOrder) => (
            <TableRow key={order.id}>
              <TableCell>{order.coinmateOrderId || '-'}</TableCell>
              <TableCell>{order.btcAmount.toFixed(8)}</TableCell>
              <TableCell>{order.pricePerBtc.toLocaleString()}</TableCell>
              <TableCell>{order.totalCzk.toLocaleString()}</TableCell>
              <TableCell>{statusLabels[typeof order.status === 'string' ? statusLabels.indexOf(order.status) : order.status] || order.status}</TableCell>
              <TableCell>
                {order.status === 'Planned' && (
                  <Button onClick={() => handleOpen(order.id!)} size="small" disabled={loading}>Nahrát na Coinmate</Button>
                )}
                {order.status === 'Submitted' && (
                  <Button onClick={() => handleCancel(order.id!)} size="small" disabled={loading}>Stáhnout z Coinmate</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
} 