import React from 'react';
import { Card, Row, Col, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { LoanFormNavigationProps } from './types';

/**
 * Komponent pro navigaci formuláře půjčky
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na navigaci
 */
const LoanFormNavigation: React.FC<LoanFormNavigationProps> = ({
  currentStep,
  totalSteps,
  isLastStep,
  isSaving,
  onPrevious,
  onNext,
  onCancel,
  onSubmit,
}) => {
  return (
    <Card 
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'white',
        zIndex: 10,
        borderTop: '1px solid #f0f0f0',
        margin: '24px -24px -24px -24px',
        padding: '16px 24px',
      }}
    >
      <Row justify="space-between" align="middle">
        <Col>
          {currentStep > 0 && (
            <Button onClick={onPrevious}>
              Předchozí
            </Button>
          )}
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={onCancel}
            >
              Zrušit
            </Button>
            {!isLastStep ? (
              <Button 
                type="primary" 
                onClick={onNext}
              >
                Další
              </Button>
            ) : (
              <Button 
                type="primary" 
                loading={isSaving}
                onClick={onSubmit}
              >
                Dokončit
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default LoanFormNavigation; 