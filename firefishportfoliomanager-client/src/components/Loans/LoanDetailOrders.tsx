import React, { useState } from 'react';
import { Button, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Alert, TableFooter } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { openSellOrder, cancelSellOrder, syncSellOrders } from '../../services/exitStrategyService';
import { fetchSellOrdersForLoan } from '../../services/loanService';
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
  const [orders, setOrders] = useState<SellOrder[]>([]);

  React.useEffect(() => {
    if (!loan.id) return;
    setLoading(true);
    fetchSellOrdersForLoan(getAccessToken, loan.id)
      .then(setOrders)
      .catch(() => setError('Chyba při načítání orderů'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [loan.id, refresh]);

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

  if (loading) return <Box className="py-4 text-center">Načítám ordery...</Box>;

  // Calculate totals for the footer
  const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Failed'); // Consider only active/relevant orders for totals
  const totalBtcAmount = activeOrders.reduce((sum, order) => sum + (order.btcAmount || 0), 0);
  const totalCzkValue = activeOrders.reduce((sum, order) => sum + (order.totalCzk || 0), 0);
  const weightedAveragePrice = totalBtcAmount > 0 ? totalCzkValue / totalBtcAmount : 0;

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
            <TableCell sx={{ textAlign: 'right' }}>BTC množství</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>Cena (CZK/BTC)</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>Celkem (CZK)</TableCell>
            <TableCell>Stav</TableCell>
            <TableCell>Akce</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order: SellOrder) => (
            <TableRow key={order.id}>
              <TableCell>{order.coinmateOrderId || '-'}</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{typeof order.btcAmount === 'number' ? order.btcAmount.toFixed(8) : 'N/A'}</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{typeof order.pricePerBtc === 'number' ? order.pricePerBtc.toLocaleString() : 'N/A'}</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{typeof order.totalCzk === 'number' ? order.totalCzk.toLocaleString() : 'N/A'}</TableCell>
              <TableCell>{statusLabels[typeof order.status === 'string' ? statusLabels.indexOf(order.status) : (order.status as number)] || order.status}</TableCell>
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
        <TableFooter>
          <TableRow sx={{ '& > td': { fontWeight: 'bold', borderTop: '2px solid black' } }}>
            <TableCell>CELKEM (aktivní)</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{totalBtcAmount.toFixed(8)}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{weightedAveragePrice > 0 ? weightedAveragePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{totalCzkValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Box>
  );
} 