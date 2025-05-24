import React from 'react';
import { Form, InputNumber, Card, Row, Col, Space, Button, Tooltip, Spin } from 'antd';
import { WalletOutlined, CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { LoanFormStepProps } from './types';

interface BitcoinTransactionStepProps extends LoanFormStepProps {
  isCalculating?: boolean;
  onRecalculateCollateral?: () => Promise<void>;
}

/**
 * Komponent pro Bitcoin transakční údaje
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na BTC transakce
 */
const BitcoinTransactionStep: React.FC<BitcoinTransactionStepProps> = ({ 
  loanData, 
  form, 
  onFieldChange,
  isCalculating = false,
  onRecalculateCollateral
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Poplatky */}
      <Card
        title={
          <Space>
            <WalletOutlined style={{ color: '#fa8c16' }} />
            Poplatky
          </Space>
        }
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  Poplatky BTC
                  <Tooltip title="Poplatky za služby v BTC">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </Space>
              }
              name="feesBtc"
              rules={[
                { required: true, message: 'Zadejte poplatky v BTC' },
                { type: 'number', min: 0, message: 'Poplatky nemohou být záporné' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00000000"
                step={0.00000001}
                precision={8}
                min={0}
                addonAfter="₿"
                onChange={(value) => onFieldChange('feesBtc', value || 0)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  Transakční poplatky BTC
                  <Tooltip title="Síťové poplatky za Bitcoin transakce">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </Space>
              }
              name="transactionFeesBtc"
              rules={[
                { required: true, message: 'Zadejte transakční poplatky' },
                { type: 'number', min: 0, message: 'Transakční poplatky nemohou být záporné' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00000000"
                step={0.00000001}
                precision={8}
                min={0}
                addonAfter="₿"
                onChange={(value) => onFieldChange('transactionFeesBtc', value || 0)}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Kolaterál */}
      <Card
        title={
          <Space>
            <WalletOutlined style={{ color: '#1890ff' }} />
            Kolaterál
          </Space>
        }
        extra={
          onRecalculateCollateral && (
            <Button
              type="primary"
              icon={isCalculating ? <Spin size="small" /> : <CalculatorOutlined />}
              loading={isCalculating}
              onClick={onRecalculateCollateral}
              size="small"
            >
              Přepočítat kolaterál
            </Button>
          )
        }
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  Kolaterál BTC
                  <Tooltip title="Bitcoin kolaterál pro půjčku">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </Space>
              }
              name="collateralBtc"
              rules={[
                { required: true, message: 'Zadejte kolaterál v BTC' },
                { type: 'number', min: 0, message: 'Kolaterál nemůže být záporný' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00000000"
                step={0.00000001}
                precision={8}
                min={0}
                addonAfter="₿"
                onChange={(value) => onFieldChange('collateralBtc', value || 0)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Celkem odesláno BTC"
              help="Automaticky vypočítáno: kolaterál + poplatky + transakční poplatky"
            >
              <InputNumber
                style={{ width: '100%' }}
                value={(loanData.collateralBtc || 0) + (loanData.feesBtc || 0) + (loanData.transactionFeesBtc || 0)}
                disabled
                precision={8}
                addonAfter="₿"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Nákup Bitcoin */}
      <Card
        title={
          <Space>
            <WalletOutlined style={{ color: '#f7931a' }} />
            Nákup Bitcoin
          </Space>
        }
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  Nakoupeno BTC
                  <Tooltip title="Množství BTC nakoupené za půjčenou částku">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </Space>
              }
              name="purchasedBtc"
              rules={[
                { required: true, message: 'Zadejte množství nakoupeného BTC' },
                { type: 'number', min: 0, message: 'Množství nemůže být záporné' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00000000"
                step={0.00000001}
                precision={8}
                min={0}
                addonAfter="₿"
                onChange={(value) => onFieldChange('purchasedBtc', value || 0)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Efektivní BTC"
              help="Nakoupené BTC minus poplatky"
            >
              <InputNumber
                style={{ width: '100%' }}
                value={Math.max(0, (loanData.purchasedBtc || 0) - (loanData.feesBtc || 0) - (loanData.transactionFeesBtc || 0))}
                disabled
                precision={8}
                addonAfter="₿"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};

export default BitcoinTransactionStep; 