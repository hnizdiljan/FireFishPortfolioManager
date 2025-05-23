import React, { useEffect, useState } from 'react';
import { Loan } from '../../types/loanTypes';
import { 
  Radio, 
  Button, 
  Input, 
  Typography, 
  Row, 
  Col, 
  Alert, 
  Form, 
  Space, 
  Card,
  Spin,
  message
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchExitStrategy, saveExitStrategy, ExitStrategyApiResponse } from '../../services/exitStrategyService';
import { useAuthStore, AuthState } from '@store/authStore';

const { Title, Text } = Typography;

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

export default function ExitStrategyForm({ loan, onSaved }: { loan: Loan, onSaved?: () => void }) {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
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
        if (!data) return;
        
        const strategyApiType = (data as Record<string, unknown>).Type || (data as Record<string, unknown>).type;
        if (!strategyApiType) return;
        
        if (strategyApiType === 'HODL') setStrategyType('HODL');
        
        if (strategyApiType === 'CustomLadder') {
          setStrategyType('CustomLadder');
          const mappedOrders = (data as Record<string, unknown>).Orders as Array<Record<string, unknown>> | undefined;
          const orders = mappedOrders?.map((o: Record<string, unknown>) => ({
            TargetPriceCzk: o.TargetPriceCzk?.toString() ?? '',
            PercentToSell: o.PercentToSell?.toString() ?? '',
          })) || [];
          const ordersToSet = orders.length > 0 ? orders : defaultCustomLadder().Orders;
          setCustomLadder({ Type: 'CustomLadder', Orders: ordersToSet });
        }
        
        if (strategyApiType === 'SmartDistribution') {
          const dataRecord = data as Record<string, unknown>;
          
          // Zkus obě konvence pojmenování - PascalCase i camelCase
          const targetProfitPercent = dataRecord.TargetProfitPercent || dataRecord.targetProfitPercent;
          const orderCount = dataRecord.OrderCount || dataRecord.orderCount;
          const btcProfitRatioPercent = dataRecord.BtcProfitRatioPercent || dataRecord.btcProfitRatioPercent;
          
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

  // Handler pro změnu typu strategie
  const handleTypeChange = (e: RadioChangeEvent) => {
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

         return { TargetPriceCzk: price, PercentToSell: percent };
      });

      const sum = orders.reduce((acc, o) => acc + o.PercentToSell, 0);
      if (sum > 100) {
        setError('Součet procent nesmí přesáhnout 100');
        hasInputError = true;
      }

      if (hasInputError) return null;

      return { type: 'CustomLadder', Orders: orders };
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
         if (smartDist.BtcProfitRatioPercent !== '' && 
             (isNaN(btcProfitRatioPercent) || btcProfitRatioPercent < 0 || btcProfitRatioPercent > 100)) {
            setInputErrors(prev => ({...prev, smart_BtcProfitRatioPercent: 'Zadejte procento (0-100)'}));
            hasInputError = true;
        }

      if (hasInputError) return null;

      return {
        type: 'SmartDistribution',
        TargetProfitPercent: targetProfitPercent,
        OrderCount: orderCount,
        BtcProfitRatioPercent: btcProfitRatioPercent,
      };
    }

    return null;
  };

  // Uložení strategie
  const handleSave = async () => {
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
      message.success('Strategie úspěšně uložena');
      if (onSaved) onSaved();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při ukládání strategie';
      setError(errorMessage);
      console.error('Save strategy error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
        <Spin size="large" />
        <Text style={{ marginLeft: 16 }}>Načítám strategii...</Text>
      </div>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <Form onFinish={handleSave} layout="vertical">
        <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
          Typ výstupní strategie
        </Title>
        
        <Space direction="vertical" style={{ marginBottom: 16 }}>
          <Radio.Group onChange={handleTypeChange} value={strategyType}>
            {STRATEGY_TYPES.map(type => (
              <Radio key={type.value} value={type.value} style={{ display: 'block', marginBottom: 8 }}>
                {type.label}
              </Radio>
            ))}
          </Radio.Group>
        </Space>

        {strategyType === 'CustomLadder' && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Custom Ladder ordery:</Title>
            {customLadder.Orders.map((order, idx) => (
              <Row key={idx} gutter={16} style={{ marginBottom: 16, alignItems: 'flex-start' }}>
                <Col flex="1">
                  <Form.Item 
                    label="Cílová cena (CZK/BTC)"
                    style={{ marginBottom: 0 }}
                    validateStatus={inputErrors[`custom_TargetPriceCzk_${idx}`] ? 'error' : ''}
                    help={inputErrors[`custom_TargetPriceCzk_${idx}`] || ''}
                  >
                    <Input
                      placeholder="Např. 2500000"
                      value={order.TargetPriceCzk}
                      onChange={e => handleCustomOrderChange(idx, 'TargetPriceCzk', e.target.value)}
                      status={inputErrors[`custom_TargetPriceCzk_${idx}`] ? 'error' : ''}
                    />
                  </Form.Item>
                </Col>
                <Col flex="1">
                  <Form.Item 
                    label="Procento k prodeji (%)"
                    style={{ marginBottom: 0 }}
                    validateStatus={inputErrors[`custom_PercentToSell_${idx}`] ? 'error' : ''}
                    help={inputErrors[`custom_PercentToSell_${idx}`] || ''}
                  >
                    <Input
                      placeholder="Např. 25"
                      value={order.PercentToSell}
                      onChange={e => handleCustomOrderChange(idx, 'PercentToSell', e.target.value)}
                      status={inputErrors[`custom_PercentToSell_${idx}`] ? 'error' : ''}
                    />
                  </Form.Item>
                </Col>
                {customLadder.Orders.length > 1 && (
                  <Col>
                    <Form.Item label=" " style={{ marginBottom: 0 }}>
                      <Button 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemoveOrder(idx)} 
                        disabled={loading}
                        danger
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            ))}
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={handleAddOrder} 
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              Přidat order
            </Button>
          </div>
        )}

        {strategyType === 'SmartDistribution' && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Parametry chytré distribuce:</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  label="Cílový zisk (%)"
                  validateStatus={inputErrors.smart_TargetProfitPercent ? 'error' : ''}
                  help={inputErrors.smart_TargetProfitPercent || ''}
                >
                  <Input
                    placeholder="Např. 20"
                    value={smartDist.TargetProfitPercent}
                    onChange={e => handleSmartChange('TargetProfitPercent', e.target.value)}
                    status={inputErrors.smart_TargetProfitPercent ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Počet orderů"
                  validateStatus={inputErrors.smart_OrderCount ? 'error' : ''}
                  help={inputErrors.smart_OrderCount || ''}
                >
                  <Input
                    placeholder="Např. 5"
                    value={smartDist.OrderCount}
                    onChange={e => handleSmartChange('OrderCount', e.target.value)}
                    status={inputErrors.smart_OrderCount ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="BTC na profit (%)"
                  validateStatus={inputErrors.smart_BtcProfitRatioPercent ? 'error' : ''}
                  help={inputErrors.smart_BtcProfitRatioPercent || ''}
                >
                  <Input
                    placeholder="Např. 80"
                    value={smartDist.BtcProfitRatioPercent}
                    onChange={e => handleSmartChange('BtcProfitRatioPercent', e.target.value)}
                    status={inputErrors.smart_BtcProfitRatioPercent ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {error && (
          <Alert 
            message={error} 
            type="error" 
            style={{ marginBottom: 16 }} 
            showIcon 
          />
        )}
        
        {success && (
          <Alert 
            message="Strategie úspěšně uložena" 
            type="success" 
            style={{ marginBottom: 16 }} 
            showIcon 
          />
        )}

        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          disabled={Object.keys(inputErrors).length > 0}
          style={{ marginTop: 16 }}
        >
          {loading ? 'Ukládám...' : 'Uložit strategii'}
        </Button>
      </Form>
    </Card>
  );
} 