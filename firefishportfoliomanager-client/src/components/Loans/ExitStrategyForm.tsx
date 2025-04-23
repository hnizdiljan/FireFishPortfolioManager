import React, { useEffect, useState } from 'react';
import { Loan } from '../../types/loanTypes';
import { Radio, Button, TextField, Typography, Box, Grid, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchExitStrategy, saveExitStrategy } from '../../services/exitStrategyService';
import { useAuth } from '../../context/AuthContext';

// Typy strategií
const STRATEGY_TYPES = [
  { value: 'HODL', label: 'HODL (držet do splatnosti)' },
  { value: 'CustomLadder', label: 'Custom Ladder (vlastní žebřík)' },
  { value: 'SmartDistribution', label: 'Smart Distribution (automatizované rozdělení)' },
];

// Výchozí struktury strategií
const defaultCustomLadder = () => ({
  Type: 'CustomLadder',
  Orders: [
    { TargetPriceCzk: '', PercentToSell: '' },
  ],
});
const defaultSmartDistribution = () => ({
  Type: 'SmartDistribution',
  TargetProfitPercent: '',
  OrderCount: '',
  BtcProfitRatioPercent: '',
});

type ExitStrategyApiResponse = { Type: string; Orders?: any[]; TargetProfitPercent?: number; OrderCount?: number; BtcProfitRatioPercent?: number };

export default function ExitStrategyForm({ loan, onSaved }: { loan: Loan, onSaved?: () => void }) {
  const { getAccessToken } = useAuth();
  const [strategyType, setStrategyType] = useState('HODL');
  const [customLadder, setCustomLadder] = useState(defaultCustomLadder());
  const [smartDist, setSmartDist] = useState(defaultSmartDistribution());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Načtení existující strategie
  useEffect(() => {
    setLoading(true);
    fetchExitStrategy(getAccessToken, loan.id)
      .then((data: ExitStrategyApiResponse | null) => {
        if (!data) return;
        if (data.Type === 'HODL') setStrategyType('HODL');
        if (data.Type === 'CustomLadder') {
          setStrategyType('CustomLadder');
          setCustomLadder({ ...data, Orders: data.Orders?.map((o: any) => ({ ...o })) || [] });
        }
        if (data.Type === 'SmartDistribution') {
          setStrategyType('SmartDistribution');
          setSmartDist({
            Type: 'SmartDistribution',
            TargetProfitPercent: data.TargetProfitPercent?.toString() ?? '',
            OrderCount: data.OrderCount?.toString() ?? '',
            BtcProfitRatioPercent: data.BtcProfitRatioPercent?.toString() ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loan.id, getAccessToken]);

  // Handlery pro změnu typu strategie
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategyType(e.target.value);
    setError(null);
    setSuccess(false);
  };

  // Handlery pro Custom Ladder
  const handleCustomOrderChange = (idx: number, field: string, value: string) => {
    const updated = customLadder.Orders.map((o, i) => i === idx ? { ...o, [field]: value } : o);
    setCustomLadder({ ...customLadder, Orders: updated });
  };
  const handleAddOrder = () => {
    setCustomLadder({ ...customLadder, Orders: [...customLadder.Orders, { TargetPriceCzk: '', PercentToSell: '' }] });
  };
  const handleRemoveOrder = (idx: number) => {
    setCustomLadder({ ...customLadder, Orders: customLadder.Orders.filter((_, i) => i !== idx) });
  };

  // Handlery pro Smart Distribution
  const handleSmartChange = (field: string, value: string) => {
    setSmartDist({ ...smartDist, [field]: value });
  };

  // Validace a serializace strategie
  const validateAndSerialize = () => {
    if (strategyType === 'HODL') {
      return { type: 'HODL' };
    }
    if (strategyType === 'CustomLadder') {
      const orders = customLadder.Orders.map(o => ({
        targetPriceCzk: Number(o.TargetPriceCzk),
        percentToSell: Number(o.PercentToSell),
      }));
      const sum = orders.reduce((acc, o) => acc + o.percentToSell, 0);
      if (sum > 100) {
        setError('Součet procent nesmí přesáhnout 100');
        return null;
      }
      if (orders.some(o => !o.targetPriceCzk || !o.percentToSell)) {
        setError('Vyplňte všechny hodnoty orderů');
        return null;
      }
      return { type: 'CustomLadder', orders };
    }
    if (strategyType === 'SmartDistribution') {
      if (!smartDist.TargetProfitPercent || !smartDist.OrderCount || !smartDist.BtcProfitRatioPercent) {
        setError('Vyplňte všechny parametry strategie');
        return null;
      }
      return {
        type: 'SmartDistribution',
        targetProfitPercent: Number(smartDist.TargetProfitPercent),
        orderCount: Number(smartDist.OrderCount),
        btcProfitRatioPercent: Number(smartDist.BtcProfitRatioPercent),
      };
    }
    return null;
  };

  // Uložení strategie
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const strategy = validateAndSerialize();
    if (!strategy) return;
    setLoading(true);
    try {
      await saveExitStrategy(getAccessToken, loan.id, strategy);
      setSuccess(true);
      if (onSaved) onSaved();
    } catch (e) {
      setError('Chyba při ukládání strategie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <Typography variant="h6" gutterBottom>Exit strategie</Typography>
      <Box mb={2}>
        {STRATEGY_TYPES.map(type => (
          <label key={type.value} style={{ marginRight: 24 }}>
            <Radio
              checked={strategyType === type.value}
              onChange={handleTypeChange}
              value={type.value}
              name="strategyType"
              color="primary"
            />
            {type.label}
          </label>
        ))}
      </Box>
      {strategyType === 'CustomLadder' && (
        <Box mb={2}>
          <Typography variant="subtitle1">Sell ordery</Typography>
          {customLadder.Orders.map((order, idx) => (
            <Grid container spacing={1} alignItems="center" key={idx}>
              <Grid item xs={5}>
                <TextField
                  label="Cílová cena (CZK)"
                  type="number"
                  value={order.TargetPriceCzk}
                  onChange={e => handleCustomOrderChange(idx, 'TargetPriceCzk', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  label="Procento BTC (%)"
                  type="number"
                  value={order.PercentToSell}
                  onChange={e => handleCustomOrderChange(idx, 'PercentToSell', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton onClick={() => handleRemoveOrder(idx)} disabled={customLadder.Orders.length === 1}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button onClick={handleAddOrder} variant="outlined" sx={{ mt: 1 }}>Přidat order</Button>
        </Box>
      )}
      {strategyType === 'SmartDistribution' && (
        <Box mb={2}>
          <Typography variant="subtitle1">Parametry Smart Distribution</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Cílový zisk (%)"
                type="number"
                value={smartDist.TargetProfitPercent}
                onChange={e => handleSmartChange('TargetProfitPercent', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Počet orderů"
                type="number"
                value={smartDist.OrderCount}
                onChange={e => handleSmartChange('OrderCount', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="BTC zisk (%)"
                type="number"
                value={smartDist.BtcProfitRatioPercent}
                onChange={e => handleSmartChange('BtcProfitRatioPercent', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Strategie byla uložena</Alert>}
      <Button type="submit" variant="contained" color="primary" disabled={loading}>
        {loading ? 'Ukládám...' : 'Uložit'}
      </Button>
    </form>
  );
} 