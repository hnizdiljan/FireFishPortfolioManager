import React from 'react';
import { Card, Row, Col, Typography, Steps } from 'antd';
import { InfoCircleOutlined, DollarOutlined, WalletOutlined, SaveOutlined } from '@ant-design/icons';
import { LoanFormHeaderProps } from './types';

const { Title, Text } = Typography;

/**
 * Komponent pro header formuláře půjčky
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na zobrazení hlavičky a progressu
 */
const LoanFormHeader: React.FC<LoanFormHeaderProps> = ({
  isEditing,
  currentStep,
  totalSteps,
}) => {
  const steps = [
    {
      title: 'Základní údaje',
      icon: <InfoCircleOutlined />,
    },
    {
      title: 'Finanční detaily',
      icon: <DollarOutlined />,
    },
    {
      title: 'Bitcoin transakce',
      icon: <WalletOutlined />,
    },
    {
      title: 'Přehled',
      icon: <SaveOutlined />,
    },
  ];

  return (
    <>
      {/* Header */}
      <Card 
        style={{ 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div style={{ color: 'white' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                {isEditing ? 'Upravit půjčku' : 'Nová půjčka'}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                {isEditing 
                  ? 'Aktualizujte údaje o vaší půjčce' 
                  : 'Vyplňte všechny potřebné údaje pro vytvoření nové půjčky'
                }
              </Text>
            </Col>
            <Col>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                Krok {currentStep + 1} z {totalSteps}
              </Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Progress Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps 
          current={currentStep} 
          items={steps.map((step, index) => ({
            ...step,
            status: index === currentStep ? 'process' : index < currentStep ? 'finish' : 'wait'
          }))} 
        />
        <div style={{ marginTop: 16 }}>
          <div 
            style={{ 
              background: '#f0f0f0', 
              height: '4px', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{ 
                background: '#1890ff', 
                height: '100%', 
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </Card>
    </>
  );
};

export default LoanFormHeader; 