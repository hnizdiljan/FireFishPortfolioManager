import React from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Card, Row, Col, Space } from 'antd';
import { InfoCircleOutlined, CalendarOutlined, IdcardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { LoanFormStepProps } from './types';

const { Option } = Select;

/**
 * Komponent pro základní údaje půjčky
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na základní informace
 */
const BasicInfoStep: React.FC<LoanFormStepProps> = ({ loanData, form, onFieldChange }) => {
  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          Základní údaje půjčky
        </Space>
      }
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            label="ID půjčky"
            name="loanId"
            rules={[{ required: true, message: 'Zadejte ID půjčky' }]}
          >
            <Input
              placeholder="např. LOAN2024001"
              prefix={<IdcardOutlined />}
              onChange={(e) => onFieldChange('loanId', e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Vyberte status půjčky' }]}
          >
            <Select
              placeholder="Vyberte status"
              onChange={(value) => onFieldChange('status', value)}
            >
              <Option value="Active">Aktivní</Option>
              <Option value="Closed">Uzavřená</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Datum půjčky"
            name="loanDate"
            rules={[{ required: true, message: 'Zadejte datum půjčky' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Vyberte datum"
              format="DD.MM.YYYY"
              suffixIcon={<CalendarOutlined />}
              onChange={(date) => onFieldChange('loanDate', date ? date.format('YYYY-MM-DD') : null)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Doba splatnosti (měsíce)"
            name="loanPeriodMonths"
            rules={[
              { required: true, message: 'Zadejte dobu splatnosti' },
              { type: 'number', min: 1, max: 120, message: 'Doba splatnosti musí být 1-120 měsíců' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="6"
              min={1}
              max={120}
              onChange={(value) => onFieldChange('loanPeriodMonths', value || 0)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Datum splacení"
            name="repaymentDate"
            help="Automaticky se vypočítá na základě data půjčky a doby splatnosti"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Automaticky vypočítáno"
              format="DD.MM.YYYY"
              disabled
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default BasicInfoStep; 