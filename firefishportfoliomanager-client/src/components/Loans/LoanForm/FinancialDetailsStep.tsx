import React from 'react';
import { Form, InputNumber, Card, Row, Col, Space, Tooltip } from 'antd';
import { DollarOutlined, PercentageOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { LoanFormStepProps } from './types';
import { formatCurrency } from './utils';

/**
 * Komponent pro finanční údaje půjčky
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na finanční informace
 */
const FinancialDetailsStep: React.FC<LoanFormStepProps> = ({ loanData, form, onFieldChange }) => {
  return (
    <Card
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          Finanční detaily
        </Space>
      }
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space>
                Půjčená částka (CZK)
                <Tooltip title="Celková částka, kterou si půjčujete">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Space>
            }
            name="loanAmountCzk"
            rules={[
              { required: true, message: 'Zadejte půjčenou částku' },
              { type: 'number', min: 1, message: 'Částka musí být kladná' }
            ]}
          >
                                    <InputNumber              style={{ width: '100%' }}              placeholder="100000"              min={0}              step={1000}              addonAfter="CZK"              onChange={(value) => onFieldChange('loanAmountCzk', value || 0)}            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space>
                Úroková sazba (%)
                <Tooltip title="Roční úroková sazba">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Space>
            }
            name="interestRate"
            rules={[
              { required: true, message: 'Zadejte úrokovou sazbu' },
              { type: 'number', min: 0, max: 100, message: 'Úroková sazba musí být 0-100%' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="5.5"
              min={0}
              max={100}
              step={0.1}
              precision={2}
              addonBefore={<PercentageOutlined />}
              addonAfter="%"
              onChange={(value) => onFieldChange('interestRate', value || 0)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space>
                Částka k splacení (CZK)
                <Tooltip title="Automaticky vypočítáno: půjčka + úroky">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Space>
            }
            name="repaymentAmountCzk"
            help="Automaticky se vypočítá na základě půjčené částky a úrokové sazby"
          >
                        <InputNumber              style={{ width: '100%' }}              placeholder="Automaticky vypočítáno"              min={0}              step={1000}              addonAfter="CZK"              onChange={(value) => onFieldChange('repaymentAmountCzk', value || 0)}            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Výše úroků (CZK)"
            help="Rozdíl mezi částkou k splacení a půjčenou částkou"
          >
            <InputNumber
              style={{ width: '100%' }}
              value={(loanData.repaymentAmountCzk || 0) - (loanData.loanAmountCzk || 0)}
              disabled
              addonAfter="CZK"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default FinancialDetailsStep; 