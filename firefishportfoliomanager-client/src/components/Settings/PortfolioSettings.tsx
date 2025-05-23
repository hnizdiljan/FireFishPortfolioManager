import React from 'react';
import { Card, Form, Button, Typography, Space, Alert, Statistic } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import NumericInput from '../shared/NumericInput';

const { Title, Text } = Typography;

interface PortfolioSettingsProps {
  allocatedBtc: number;
  setAllocatedBtc: (val: number) => void;
  drawdownFromAth: number;
  setDrawdownFromAth: (val: number) => void;
  liquidationPrice: number | null;
  setLiquidationPrice: (val: number) => void;
  ltvPercent: number;
  setLtvPercent: (val: number) => void;
  setLastChanged: (val: 'drawdown' | 'liquidation' | 'ltv') => void;
  isDrawdownValid: boolean;
  isLtvValid: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
  saving: boolean;
  effectiveLiquidationPrice: number | null;
  maxLoanAmount: number;
  showPlatformLimitWarning: boolean;
  platformLimitPrice: number | null;
  showLtvCapWarning: boolean;
  btcPrice: number | null;
  effectiveDrawdownOutput: string;
  ltvToCurrentPrice: number;
}

const PortfolioSettings: React.FC<PortfolioSettingsProps> = ({
  allocatedBtc,
  setAllocatedBtc,
  drawdownFromAth,
  setDrawdownFromAth,
  liquidationPrice,
  setLiquidationPrice,
  ltvPercent,
  setLtvPercent,
  setLastChanged,
  isDrawdownValid,
  isLtvValid,
  handleSaveSettings,
  saving,
  effectiveLiquidationPrice,
  maxLoanAmount,
  showPlatformLimitWarning,
  platformLimitPrice,
  showLtvCapWarning,
  btcPrice,
  effectiveDrawdownOutput,
  ltvToCurrentPrice,
}) => (
  <Card>
    <Form onFinish={handleSaveSettings} layout="vertical">
      <Title level={4} style={{ marginBottom: 16 }}>Portfolio Parameters</Title>
      
      <Form.Item
        label="Allocated BTC"
        help="Amount of BTC you want to allocate for Fire Fish loans"
        validateStatus={!isDrawdownValid ? 'error' : ''}
      >
        <NumericInput
          value={allocatedBtc}
          onChangeNumber={(num) => setAllocatedBtc(num)}
          min={0}
          step="any"
          unit="BTC"
          style={{ maxWidth: 400 }}
        />
      </Form.Item>

      <Form.Item
        label="Drawdown from ATH to secure with collateral (%)"
        help="How much drop from the all-time-high (ATH) price you want to secure with collateral"
        validateStatus={!isDrawdownValid ? 'error' : ''}
        hasFeedback={!isDrawdownValid}
      >
        <NumericInput
          value={drawdownFromAth}
          onChangeNumber={(num) => { const val = Math.round(num); setDrawdownFromAth(val); setLastChanged('drawdown'); }}
          min={1}
          max={100}
          step={1}
          unit="%"
          style={{ maxWidth: 400 }}
        />
        {!isDrawdownValid && (
          <Text type="danger" style={{ fontSize: 12 }}>
            Drawdown musí být v rozsahu 1-100 %.
          </Text>
        )}
      </Form.Item>

      <Form.Item
        label="Absolute liquidation price (CZK)"
        help="The price down to which your collateral will cover your loans"
      >
        <NumericInput
          value={liquidationPrice ?? 0}
          onChangeNumber={(num) => { setLiquidationPrice(Math.round(num)); setLastChanged('liquidation'); }}
          min={0}
          step={1}
          unit="CZK"
          style={{ maxWidth: 400 }}
        />
      </Form.Item>

      <Form.Item
        label="LTV (%)"
        help="Loan-to-Value ratio you want to accept (max 50%)"
        validateStatus={!isLtvValid ? 'error' : ''}
        hasFeedback={!isLtvValid}
      >
        <NumericInput
          value={ltvPercent}
          onChangeNumber={(num) => { const val = Math.round(num); setLtvPercent(val); setLastChanged('ltv'); }}
          min={1}
          max={50}
          step={1}
          unit="%"
          style={{ maxWidth: 400 }}
        />
        {!isLtvValid && (
          <Text type="danger" style={{ fontSize: 12 }}>
            LTV musí být v rozsahu 1-50 %.
          </Text>
        )}
      </Form.Item>

      <Card
        type="inner"
        style={{ backgroundColor: '#e6f7ff', marginBottom: 24 }}
      >
        <Title level={5} style={{ color: '#1890ff', marginBottom: 8 }}>
          Maximum Loan Amount
        </Title>
        <Statistic
          value={effectiveLiquidationPrice ? Math.round(maxLoanAmount) : 0}
          suffix="CZK"
          valueStyle={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}
        />
        
        {showPlatformLimitWarning && (
          <Alert
            message={`Upozornění: Platforma FireFish dovoluje maximální LTV 50 %, proto bude vaše skutečná likvidační cena ${platformLimitPrice ? Math.round(platformLimitPrice).toLocaleString() : '...'} CZK.`}
            type="warning"
            style={{ marginTop: 8 }}
          />
        )}

        {showLtvCapWarning && (
          <Alert
            message="Omezení LTV"
            description="Hodnoty parametrů nejsou v povoleném rozsahu. Maximální hodnota LTV je 50 %. Hodnoty ostatních parametrů byly upraveny podle tohoto limitu."
            type="error"
            icon={<ExclamationCircleOutlined />}
            style={{ marginTop: 8 }}
          />
        )}

        <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Efektivní likvidační cena: {effectiveLiquidationPrice ? Math.round(effectiveLiquidationPrice).toLocaleString() : '...'} CZK
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Aktuální cena BTC: {btcPrice ? Math.round(btcPrice).toLocaleString() : '...'} CZK
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Effective drawdown from ATH: {effectiveDrawdownOutput}%
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            LTV (k aktuální ceně BTC): {showLtvCapWarning ? '50.00' : ltvToCurrentPrice.toFixed(2)}%
          </Text>
        </Space>
      </Card>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Form.Item>
    </Form>
  </Card>
);

export default PortfolioSettings; 