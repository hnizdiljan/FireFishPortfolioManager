import React from 'react';
import { Card, Row, Col, Typography, Space, Alert, Divider, Button } from 'antd';
import { InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { SummaryStepProps } from './types';
import { formatCurrency, formatBtc } from './utils';

const { Title, Text } = Typography;

/**
 * Komponent pro shrnutí půjčky
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na zobrazení přehledu
 */
const SummaryStep: React.FC<SummaryStepProps> = ({ 
  loanData, 
  loanSummary, 
  isEditing, 
  isSaving,
  onSubmit 
}) => {
  return (
    <Card 
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#52c41a' }} />
          Přehled půjčky
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Alert
        message="Zkontrolujte všechny údaje"
        description="Ověřte správnost všech zadaných informací. Po potvrzení bude půjčka vytvořena v systému."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 16]}>
        <Col xs={24}>
          <Title level={4}>💰 Finanční přehled</Title>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered style={{ backgroundColor: '#f6ffed' }}>
            <Text type="secondary">Půjčená částka</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
              {formatCurrency(loanSummary.loanAmount)} CZK
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered style={{ backgroundColor: '#fff7e6' }}>
            <Text type="secondary">Úroky</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
              {formatCurrency(loanSummary.interestAmount)} CZK
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered style={{ backgroundColor: '#f0f5ff' }}>
            <Text type="secondary">Celkem k splacení</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
              {formatCurrency(loanSummary.repaymentAmount)} CZK
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 16]}>
        <Col xs={24}>
          <Title level={4}>₿ Bitcoin přehled</Title>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered style={{ backgroundColor: '#fff0f6' }}>
            <Text type="secondary">Odesláno celkem</Text>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#eb2f96' }}>
              {formatBtc(loanSummary.totalSent)} ₿
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered style={{ backgroundColor: '#f6ffed' }}>
            <Text type="secondary">Nakoupeno</Text>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
              {formatBtc(loanSummary.purchased)} ₿
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered style={{ backgroundColor: '#f0f5ff' }}>
            <Text type="secondary">Skutečně investováno</Text>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              {formatBtc(loanSummary.effectiveBtc)} ₿
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ≈ {formatCurrency(loanSummary.currentBtcValue)} CZK
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 16]}>
        <Col xs={24}>
          <Title level={4}>📋 Základní údaje</Title>
        </Col>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size="small">
            <Text><strong>ID půjčky:</strong> {loanData.loanId}</Text>
            <Text><strong>Datum půjčky:</strong> {loanData.loanDate ? dayjs(loanData.loanDate).format('DD.MM.YYYY') : '-'}</Text>
            <Text><strong>Doba splatnosti:</strong> {loanData.loanPeriodMonths} měsíců</Text>
          </Space>
        </Col>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size="small">
            <Text><strong>Datum splacení:</strong> {loanData.repaymentDate ? dayjs(loanData.repaymentDate).format('DD.MM.YYYY') : '-'}</Text>
            <Text><strong>Úroková sazba:</strong> {loanData.interestRate}%</Text>
            <Text><strong>Status:</strong> {loanData.status === 'Active' ? 'Aktivní' : 'Uzavřená'}</Text>
          </Space>
        </Col>
      </Row>

      {/* Explicit save button in overview step */}
      <Divider />
      <Row justify="center" style={{ marginTop: 24 }}>
        <Col>
          <Button 
            type="primary"
            size="large"
            loading={isSaving}
            icon={<SaveOutlined />}
            onClick={onSubmit}
            style={{
              height: '48px',
              fontSize: '16px',
              paddingLeft: '32px',
              paddingRight: '32px',
            }}
          >
            {isEditing ? 'Aktualizovat půjčku' : 'Vytvořit půjčku'}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default SummaryStep; 