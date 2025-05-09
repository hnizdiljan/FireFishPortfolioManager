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
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});

  // Načtení existující strategie
  useEffect(() => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setInputErrors({});
    fetchExitStrategy(getAccessToken, loan.id)
      .then((data: ExitStrategyApiResponse | null) => {
        console.log('Načtená strategie z API:', data); // Logování pro debug
        if (!data) return;
        // Fallback pro různé varianty názvu typu
        const strategyApiType = (data as any).Type || (data as any).type;
        if (!strategyApiType) return;
        if (strategyApiType === 'HODL') setStrategyType('HODL');
        if (strategyApiType === 'CustomLadder') {
          setStrategyType('CustomLadder');
          // Map API response (lowercase 'orders', camelCase properties) to component state (PascalCase properties, string values)
          const mappedOrders = (data as any).orders?.map((o: any) => ({
            TargetPriceCzk: o.targetPriceCzk?.toString() ?? '',
            PercentToSell: o.percentToSell?.toString() ?? '',
          })) || [];
          // Ensure at least one order row exists if API returns empty array
          const ordersToSet = mappedOrders.length > 0 ? mappedOrders : defaultCustomLadder().Orders;
          setCustomLadder({ Type: 'CustomLadder', Orders: ordersToSet });
        }
        if (strategyApiType === 'SmartDistribution') {
          const targetProfitPercent = (data.TargetProfitPercent !== undefined)
            ? data.TargetProfitPercent
            : (data as any).targetProfitPercent;
          const orderCount = (data.OrderCount !== undefined)
            ? data.OrderCount
            : (data as any).orderCount;
          const btcProfitRatioPercent = (data.BtcProfitRatioPercent !== undefined)
            ? data.BtcProfitRatioPercent
            : (data as any).btcProfitRatioPercent;
          setStrategyType('SmartDistribution');
          setSmartDist({
            Type: 'SmartDistribution',
            TargetProfitPercent: targetProfitPercent?.toString() ?? '',
            OrderCount: orderCount?.toString() ?? '',
            BtcProfitRatioPercent: btcProfitRatioPercent?.toString() ?? '',
          });
        }
      })
      .catch((err) => {
        console.error('Chyba při načítání strategie:', err);
        setError('Nepodařilo se načíst uloženou strategii.');
      })
      .finally(() => setLoading(false));
  }, [loan.id, getAccessToken]);

  // Handlery pro změnu typu strategie
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategyType(e.target.value);
    setError(null);
    setSuccess(false);
    setInputErrors({});
  };

  // Handlery pro Custom Ladder
  const handleCustomOrderChange = (idx: number, field: 'TargetPriceCzk' | 'PercentToSell', value: string) => {
    const key = `custom_${field}_${idx}`;
    const commaErrorMessage = 'Používejte tečku jako oddělovač desetinných míst.';

    if (value.includes(',')) {
      setInputErrors(prev => ({ ...prev, [key]: commaErrorMessage }));
      return;
    }

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      const updated = customLadder.Orders.map((o, i) => (i === idx ? { ...o, [field]: value } : o));
      setCustomLadder({ ...customLadder, Orders: updated });
    } else {
      setInputErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };
  const handleAddOrder = () => {
    setCustomLadder({ ...customLadder, Orders: [...customLadder.Orders, { TargetPriceCzk: '', PercentToSell: '' }] });
  };
  const handleRemoveOrder = (idx: number) => {
    setCustomLadder({ ...customLadder, Orders: customLadder.Orders.filter((_, i) => i !== idx) });
    setInputErrors(prev => {
      const next = {...prev};
      delete next[`custom_TargetPriceCzk_${idx}`];
      delete next[`custom_PercentToSell_${idx}`];
      return next;
    });
  };

  // Handlery pro Smart Distribution
  const handleSmartChange = (field: 'TargetProfitPercent' | 'OrderCount' | 'BtcProfitRatioPercent', value: string) => {
    const key = `smart_${field}`;
    const commaErrorMessage = 'Používejte tečku jako oddělovač desetinných míst.';
    const integerErrorMessage = 'Zadejte prosím celé číslo.';

    if (value.includes(',')) {
        setInputErrors(prev => ({ ...prev, [key]: commaErrorMessage }));
        return;
    }

    let isValid = false;
    let specificErrorMessage = '';

    if (field === 'OrderCount') {
        isValid = value === '' || /^[1-9]\d*$/.test(value);
        if (!isValid && value !== '') {
            specificErrorMessage = integerErrorMessage;
        }
    } else {
        isValid = value === '' || /^\d*\.?\d*$/.test(value);
    }

    if (isValid) {
        setInputErrors(prev => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setSmartDist({ ...smartDist, [field]: value });
    } else {
        setInputErrors(prev => {
            const next = { ...prev };
            if (specificErrorMessage) {
                 next[key] = specificErrorMessage;
            } else if (next[key]) {
                 delete next[key];
            }
             return next;
         });
    }
  };

  // Validace a serializace strategie
  const validateAndSerialize = () => {
    setError(null);
    let hasInputError = false;

    if (strategyType === 'HODL') {
      return { type: 'HODL' };
    }

    if (strategyType === 'CustomLadder') {
      const orders = customLadder.Orders.map((o, idx) => {
         const price = Number(o.TargetPriceCzk);
         const percent = Number(o.PercentToSell);
         if (!price || price <= 0) {
            setInputErrors(prev => ({...prev, [`custom_TargetPriceCzk_${idx}`]: 'Zadejte kladnou cenu'}));
            hasInputError = true;
         }
         if (!percent || percent <= 0 || percent > 100) {
             setInputErrors(prev => ({...prev, [`custom_PercentToSell_${idx}`]: 'Zadejte procento (0-100)'}));
             hasInputError = true;
         }
         return { targetPriceCzk: price, percentToSell: percent };
      });

      const sum = orders.reduce((acc, o) => acc + o.percentToSell, 0);
      if (sum > 100) {
        setError('Součet procent nesmí přesáhnout 100');
        hasInputError = true;
      }

      if (hasInputError) return null;
      return { type: 'CustomLadder', orders };
    }

    if (strategyType === 'SmartDistribution') {
        const targetProfitPercent = Number(smartDist.TargetProfitPercent);
        const orderCount = Number(smartDist.OrderCount);
        const btcProfitRatioPercent = Number(smartDist.BtcProfitRatioPercent);

        if (!targetProfitPercent || targetProfitPercent <= 0) {
            setInputErrors(prev => ({...prev, smart_TargetProfitPercent: 'Zadejte kladný zisk'}));
            hasInputError = true;
        }
        if (!orderCount || orderCount <= 0 || !Number.isInteger(orderCount)) {
             setInputErrors(prev => ({...prev, smart_OrderCount: 'Zadejte kladné celé číslo'}));
            hasInputError = true;
        }
         // Allow 0 for btcProfitRatioPercent, ensure it's a number between 0 and 100 inclusive if provided
         if (smartDist.BtcProfitRatioPercent !== '' && 
             (isNaN(btcProfitRatioPercent) || btcProfitRatioPercent < 0 || btcProfitRatioPercent > 100)) {
            setInputErrors(prev => ({...prev, smart_BtcProfitRatioPercent: 'Zadejte procento (0-100)'}));
            hasInputError = true;
        }

      if (hasInputError) return null;
      return {
        type: 'SmartDistribution',
        targetProfitPercent: targetProfitPercent,
        orderCount: orderCount,
        btcProfitRatioPercent: btcProfitRatioPercent,
      };
    }
    return null;
  };

  // Uložení strategie
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInputErrors({});
    setSuccess(false);

    const strategy = validateAndSerialize();

    if (!strategy) {
        if (!Object.keys(inputErrors).length && !error) {
            setError('Zkontrolujte prosím zadané hodnoty.');
        }
        return;
    }

    setLoading(true);
    try {
      await saveExitStrategy(getAccessToken, loan.id, strategy);
      setSuccess(true);
      setError(null);
      setInputErrors({});
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err?.message || 'Chyba při ukládání strategie');
      console.error('Save strategy error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
        <Typography variant="body1">Načítám strategii...</Typography>
      </Box>
    ) : (
      <Box component="form" onSubmit={handleSave} noValidate sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          Typ výstupní strategie
        </Typography>
        <Box mb={2}>
          {STRATEGY_TYPES.map(type => (
            <Box key={type.value} display="flex" alignItems="center">
              <Radio
                checked={strategyType === type.value}
                onChange={handleTypeChange}
                value={type.value}
                name="strategyType"
                id={`strategy-${type.value}`}
              />
              <label htmlFor={`strategy-${type.value}`} style={{ cursor: 'pointer' }}>
                <Typography variant="subtitle1">{type.label}</Typography>
              </label>
            </Box>
          ))}
        </Box>

        {strategyType === 'CustomLadder' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Custom Ladder ordery:</Typography>
            {customLadder.Orders.map((order, idx) => (
              <Grid container spacing={2} key={idx} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={5}>
                  <TextField 
                    label="Cílová cena (CZK/BTC)" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    value={order.TargetPriceCzk}
                    onChange={e => handleCustomOrderChange(idx, 'TargetPriceCzk', e.target.value)}
                    error={!!inputErrors[`custom_TargetPriceCzk_${idx}`]}
                    helperText={inputErrors[`custom_TargetPriceCzk_${idx}`]}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField 
                    label="Procento k prodeji (%)" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    value={order.PercentToSell}
                    onChange={e => handleCustomOrderChange(idx, 'PercentToSell', e.target.value)}
                    error={!!inputErrors[`custom_PercentToSell_${idx}`]}
                    helperText={inputErrors[`custom_PercentToSell_${idx}`]}
                  />
                </Grid>
                <Grid item xs={2}>
                  {customLadder.Orders.length > 1 && (
                    <IconButton aria-label="delete order" onClick={() => handleRemoveOrder(idx)} disabled={loading}>
                       <DeleteIcon />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            ))}
            <Button onClick={handleAddOrder} variant="outlined" size="small" sx={{ mt: 1 }} disabled={loading}>
              Přidat order
            </Button>
          </Box>
        )}

        {strategyType === 'SmartDistribution' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Parametry chytré distribuce:</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField 
                    label="Cílový zisk (%)" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    value={smartDist.TargetProfitPercent}
                    onChange={e => handleSmartChange('TargetProfitPercent', e.target.value)}
                    error={!!inputErrors.smart_TargetProfitPercent}
                    helperText={inputErrors.smart_TargetProfitPercent}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                    label="Počet orderů" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    value={smartDist.OrderCount}
                    onChange={e => handleSmartChange('OrderCount', e.target.value)}
                    error={!!inputErrors.smart_OrderCount}
                    helperText={inputErrors.smart_OrderCount}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                    label="BTC na profit (%)" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    value={smartDist.BtcProfitRatioPercent}
                    onChange={e => handleSmartChange('BtcProfitRatioPercent', e.target.value)}
                    error={!!inputErrors.smart_BtcProfitRatioPercent}
                    helperText={inputErrors.smart_BtcProfitRatioPercent}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Strategie úspěšně uložena.</Alert>}

        <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} disabled={loading || Object.keys(inputErrors).length > 0}>
          {loading ? 'Ukládám...' : 'Uložit strategii'}
        </Button>

      </Box>
    )
  );
} 