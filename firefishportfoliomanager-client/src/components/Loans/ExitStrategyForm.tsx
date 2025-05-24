import React, { useEffect, useState } from 'react';
import { Loan } from '../../types/loanTypes';
import { 
  Select,
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
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchExitStrategy, setExitStrategy } from '../../services/loanExitStrategyService';
import { useAuthStore, AuthState } from '@store/authStore';
import { components } from '../../api-types';

type HodlExitStrategy = components['schemas']['HodlExitStrategy'];
type CustomLadderExitStrategy = components['schemas']['CustomLadderExitStrategy'];
type SmartDistributionExitStrategy = components['schemas']['SmartDistributionExitStrategy'];
type EquidistantLadderExitStrategy = components['schemas']['EquidistantLadderExitStrategy'];
type EquifrequentLadderExitStrategy = components['schemas']['EquifrequentLadderExitStrategy'];

type ExitStrategyUnion = 
  | HodlExitStrategy 
  | CustomLadderExitStrategy 
  | SmartDistributionExitStrategy 
  | EquidistantLadderExitStrategy 
  | EquifrequentLadderExitStrategy;

type ExitStrategyApiResponse = ExitStrategyUnion;

const { Title, Text } = Typography;

// Typy strategií
const STRATEGY_TYPES = [
  { value: 'HODL', label: 'HODL (držet do splatnosti)' },
  { value: 'CustomLadder', label: 'Custom Ladder (vlastní žebřík)' },
  { value: 'SmartDistribution', label: 'Smart Distribution (chytrá distribuce podle zisku a BTC/CZK poměru)' },
  { value: 'EquidistantLadder', label: 'Equidistant Ladder (ekvidistanční žebřík s rovnoměrně rozdělenými cenami)' },
  { value: 'EquifrequentLadder', label: 'Equifrequent Ladder (ekvifrekvenční žebřík s procentuálními nárůsty)' },
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

const defaultEquidistantLadder = () => ({
  Type: 'EquidistantLadder',
  StartPriceCzk: '',
  EndPriceCzk: '',
  OrderCount: '',
  DistributionType: 'EQUAL',
});

const defaultEquifrequentLadder = () => ({
  Type: 'EquifrequentLadder',
  BasePriceCzk: '',
  PriceIncrementPercent: '',
  OrderCount: '',
  BtcPercentPerOrder: '',
});

export default function ExitStrategyForm({ loan, onSaved }: { loan: Loan, onSaved?: () => void }) {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  const [strategyType, setStrategyType] = useState('HODL');
  const [customLadder, setCustomLadder] = useState(defaultCustomLadder());
  const [smartDist, setSmartDist] = useState(defaultSmartDistribution());
  const [equidistantLadder, setEquidistantLadder] = useState(defaultEquidistantLadder());
  const [equifrequentLadder, setEquifrequentLadder] = useState(defaultEquifrequentLadder());
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
        
        const strategyApiType = (data as Record<string, unknown>).type;
        if (!strategyApiType) return;
        
        if (strategyApiType === 'HODL') setStrategyType('HODL');
        
        if (strategyApiType === 'CustomLadder') {
          setStrategyType('CustomLadder');
          // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
          const ordersArray = (data as Record<string, unknown>).orders as Array<Record<string, unknown>> | undefined;
          const orders = ordersArray?.map((o: Record<string, unknown>) => ({
            TargetPriceCzk: o.targetPriceCzk?.toString() ?? '',
            PercentToSell: o.percentToSell?.toString() ?? '',
          })) || [];
          const ordersToSet = orders.length > 0 ? orders : defaultCustomLadder().Orders;
          setCustomLadder({ Type: 'CustomLadder', Orders: ordersToSet });
        }
        
        if (strategyApiType === 'SmartDistribution') {
          const dataRecord = data as Record<string, unknown>;
          
          // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
          const targetProfitPercent = dataRecord.targetProfitPercent;
          const orderCount = dataRecord.orderCount;
          const btcProfitRatioPercent = dataRecord.btcProfitRatioPercent;
          
          setStrategyType('SmartDistribution');
          setSmartDist({
            Type: 'SmartDistribution',
            TargetProfitPercent: targetProfitPercent?.toString() ?? '',
            OrderCount: orderCount?.toString() ?? '',
            BtcProfitRatioPercent: btcProfitRatioPercent?.toString() ?? '',
          });
        }
        
        if (strategyApiType === 'EquidistantLadder') {
          const dataRecord = data as Record<string, unknown>;
          
          setStrategyType('EquidistantLadder');
          setEquidistantLadder({
            Type: 'EquidistantLadder',
            StartPriceCzk: dataRecord.startPriceCzk?.toString() ?? '',
            EndPriceCzk: dataRecord.endPriceCzk?.toString() ?? '',
            OrderCount: dataRecord.orderCount?.toString() ?? '',
            DistributionType: dataRecord.distributionType?.toString() ?? 'EQUAL',
          });
        }
        
        if (strategyApiType === 'EquifrequentLadder') {
          const dataRecord = data as Record<string, unknown>;
          
          setStrategyType('EquifrequentLadder');
          setEquifrequentLadder({
            Type: 'EquifrequentLadder',
            BasePriceCzk: dataRecord.basePriceCzk?.toString() ?? '',
            PriceIncrementPercent: dataRecord.priceIncrementPercent?.toString() ?? '',
            OrderCount: dataRecord.orderCount?.toString() ?? '',
            BtcPercentPerOrder: dataRecord.btcPercentPerOrder?.toString() ?? '',
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
  const handleTypeChange = (value: string) => {
    setStrategyType(value);
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

  // Handlery pro Equidistant Ladder
  const handleEquidistantChange = (field: 'StartPriceCzk' | 'EndPriceCzk' | 'OrderCount' | 'DistributionType', value: string) => {
    const key = `equidistant_${field}`;
    const commaErrorMessage = 'Používejte tečku jako oddělovač desetinných míst.';
    const integerErrorMessage = 'Zadejte prosím celé číslo.';

    if (field === 'DistributionType') {
      setEquidistantLadder({ ...equidistantLadder, [field]: value });
      return;
    }

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
      setEquidistantLadder({ ...equidistantLadder, [field]: value });
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

  // Handlery pro Equifrequent Ladder
  const handleEquifrequentChange = (field: 'BasePriceCzk' | 'PriceIncrementPercent' | 'OrderCount' | 'BtcPercentPerOrder', value: string) => {
    const key = `equifrequent_${field}`;
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
      setEquifrequentLadder({ ...equifrequentLadder, [field]: value });
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
  const validateAndSerialize = (): ExitStrategyUnion | null => {
    setError(null);
    let hasInputError = false;

    if (strategyType === 'HODL') {
      return { type: 'HODL' } as HodlExitStrategy;
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

      return { 
        type: 'CustomLadder', 
        orders: orders 
      } as CustomLadderExitStrategy;
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
        targetProfitPercent: targetProfitPercent,
        orderCount: orderCount,
        btcProfitRatioPercent: btcProfitRatioPercent,
      } as SmartDistributionExitStrategy;
    }

    if (strategyType === 'EquidistantLadder') {
      const startPriceCzk = Number(equidistantLadder.StartPriceCzk);
      const endPriceCzk = Number(equidistantLadder.EndPriceCzk);
      const orderCount = Number(equidistantLadder.OrderCount);

      if (!startPriceCzk || startPriceCzk <= 0) {
        setInputErrors(prev => ({...prev, equidistant_StartPriceCzk: 'Zadejte kladnou počáteční cenu'}));
        hasInputError = true;
      }
      if (!endPriceCzk || endPriceCzk <= 0) {
        setInputErrors(prev => ({...prev, equidistant_EndPriceCzk: 'Zadejte kladnou koncovou cenu'}));
        hasInputError = true;
      }
      if (!orderCount || orderCount <= 0 || !Number.isInteger(orderCount)) {
        setInputErrors(prev => ({...prev, equidistant_OrderCount: 'Zadejte kladné celé číslo'}));
        hasInputError = true;
      }
      if (startPriceCzk >= endPriceCzk) {
        setError('Koncová cena musí být vyšší než počáteční cena');
        hasInputError = true;
      }

      if (hasInputError) return null;

      return {
        type: 'EquidistantLadder',
        startPriceCzk: startPriceCzk,
        endPriceCzk: endPriceCzk,
        orderCount: orderCount,
        distributionType: equidistantLadder.DistributionType as components['schemas']['DistributionType'],
      } as EquidistantLadderExitStrategy;
    }

    if (strategyType === 'EquifrequentLadder') {
      const basePriceCzk = Number(equifrequentLadder.BasePriceCzk);
      const priceIncrementPercent = Number(equifrequentLadder.PriceIncrementPercent);
      const orderCount = Number(equifrequentLadder.OrderCount);
      const btcPercentPerOrder = Number(equifrequentLadder.BtcPercentPerOrder);

      if (!basePriceCzk || basePriceCzk <= 0) {
        setInputErrors(prev => ({...prev, equifrequent_BasePriceCzk: 'Zadejte kladnou základní cenu'}));
        hasInputError = true;
      }
      if (!priceIncrementPercent || priceIncrementPercent <= 0) {
        setInputErrors(prev => ({...prev, equifrequent_PriceIncrementPercent: 'Zadejte kladný rozestup ceny'}));
        hasInputError = true;
      }
      if (!orderCount || orderCount <= 0 || !Number.isInteger(orderCount)) {
        setInputErrors(prev => ({...prev, equifrequent_OrderCount: 'Zadejte kladné celé číslo'}));
        hasInputError = true;
      }
      if (!btcPercentPerOrder || btcPercentPerOrder <= 0 || btcPercentPerOrder > 100) {
        setInputErrors(prev => ({...prev, equifrequent_BtcPercentPerOrder: 'Zadejte procento (0-100)'}));
        hasInputError = true;
      }

      if (hasInputError) return null;

      return {
        type: 'EquifrequentLadder',
        basePriceCzk: basePriceCzk,
        priceIncrementPercent: priceIncrementPercent,
        orderCount: orderCount,
        btcPercentPerOrder: btcPercentPerOrder,
      } as EquifrequentLadderExitStrategy;
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
      await setExitStrategy(getAccessToken, loan.id, strategy);
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
          <Select
            options={STRATEGY_TYPES}
            value={strategyType}
            onChange={handleTypeChange}
          />
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
            <Alert 
              message="Informace o strategii" 
              description="Cílový zisk se počítá vůči částce ke splacení. Potenciální hodnota strategie = součet sell orderů + zbývající BTC oceněné nejvyšší sell cenou."
              type="info" 
              style={{ marginBottom: 16 }} 
              showIcon 
            />
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

        {strategyType === 'EquidistantLadder' && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Parametry ekvidistančního žebříku:</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  label="Počáteční cena (CZK)"
                  validateStatus={inputErrors.equidistant_StartPriceCzk ? 'error' : ''}
                  help={inputErrors.equidistant_StartPriceCzk || ''}
                >
                  <Input
                    placeholder="Např. 2500000"
                    value={equidistantLadder.StartPriceCzk}
                    onChange={e => handleEquidistantChange('StartPriceCzk', e.target.value)}
                    status={inputErrors.equidistant_StartPriceCzk ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Koncová cena (CZK)"
                  validateStatus={inputErrors.equidistant_EndPriceCzk ? 'error' : ''}
                  help={inputErrors.equidistant_EndPriceCzk || ''}
                >
                  <Input
                    placeholder="Např. 3000000"
                    value={equidistantLadder.EndPriceCzk}
                    onChange={e => handleEquidistantChange('EndPriceCzk', e.target.value)}
                    status={inputErrors.equidistant_EndPriceCzk ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Počet orderů"
                  validateStatus={inputErrors.equidistant_OrderCount ? 'error' : ''}
                  help={inputErrors.equidistant_OrderCount || ''}
                >
                  <Input
                    placeholder="Např. 5"
                    value={equidistantLadder.OrderCount}
                    onChange={e => handleEquidistantChange('OrderCount', e.target.value)}
                    status={inputErrors.equidistant_OrderCount ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Typ distribuce"
                  validateStatus={inputErrors.equidistant_DistributionType ? 'error' : ''}
                  help={inputErrors.equidistant_DistributionType || ''}
                >
                  <Select
                    options={[
                      { value: 'EQUAL', label: 'Rovnoměrně' },
                      { value: 'INCREASING', label: 'Rostoucí' },
                      { value: 'DECREASING', label: 'Klesající' },
                    ]}
                    value={equidistantLadder.DistributionType}
                    onChange={(value) => handleEquidistantChange('DistributionType', value)}
                    status={inputErrors.equidistant_DistributionType ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {strategyType === 'EquifrequentLadder' && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Parametry ekvifrekvenčního žebříku:</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  label="Základní cena (CZK)"
                  validateStatus={inputErrors.equifrequent_BasePriceCzk ? 'error' : ''}
                  help={inputErrors.equifrequent_BasePriceCzk || ''}
                >
                  <Input
                    placeholder="Např. 2500000"
                    value={equifrequentLadder.BasePriceCzk}
                    onChange={e => handleEquifrequentChange('BasePriceCzk', e.target.value)}
                    status={inputErrors.equifrequent_BasePriceCzk ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Rozestup ceny (%)"
                  validateStatus={inputErrors.equifrequent_PriceIncrementPercent ? 'error' : ''}
                  help={inputErrors.equifrequent_PriceIncrementPercent || ''}
                >
                  <Input
                    placeholder="Např. 10"
                    value={equifrequentLadder.PriceIncrementPercent}
                    onChange={e => handleEquifrequentChange('PriceIncrementPercent', e.target.value)}
                    status={inputErrors.equifrequent_PriceIncrementPercent ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Počet orderů"
                  validateStatus={inputErrors.equifrequent_OrderCount ? 'error' : ''}
                  help={inputErrors.equifrequent_OrderCount || ''}
                >
                  <Input
                    placeholder="Např. 5"
                    value={equifrequentLadder.OrderCount}
                    onChange={e => handleEquifrequentChange('OrderCount', e.target.value)}
                    status={inputErrors.equifrequent_OrderCount ? 'error' : ''}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="BTC na profit (%)"
                  validateStatus={inputErrors.equifrequent_BtcPercentPerOrder ? 'error' : ''}
                  help={inputErrors.equifrequent_BtcPercentPerOrder || ''}
                >
                  <Input
                    placeholder="Např. 80"
                    value={equifrequentLadder.BtcPercentPerOrder}
                    onChange={e => handleEquifrequentChange('BtcPercentPerOrder', e.target.value)}
                    status={inputErrors.equifrequent_BtcPercentPerOrder ? 'error' : ''}
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