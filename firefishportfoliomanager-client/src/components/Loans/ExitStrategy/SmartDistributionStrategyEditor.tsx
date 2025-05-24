import React from 'react';
import { Input, Row, Col, Form, Typography, Alert } from 'antd';
import { BaseStrategyEditor, StrategyValidationResult } from './BaseStrategyEditor';
import { ExitStrategyType } from '@/types';

const { Title } = Typography;

interface SmartDistributionStrategyValue {
  type: 'SmartDistribution';
  TargetProfitPercent: string;
  OrderCount: string;
  BtcProfitRatioPercent: string;
}

export class SmartDistributionStrategyEditor extends BaseStrategyEditor<SmartDistributionStrategyValue> {
  readonly strategyType: ExitStrategyType = 'SmartDistribution';

  validateStrategy(value: SmartDistributionStrategyValue): StrategyValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    const targetProfitPercent = Number(value.TargetProfitPercent);
    const orderCount = Number(value.OrderCount);
    const btcProfitRatioPercent = Number(value.BtcProfitRatioPercent);

    if (!targetProfitPercent || targetProfitPercent <= 0) {
      errors.TargetProfitPercent = 'Zadejte kladný zisk';
      isValid = false;
    }

    if (!orderCount || orderCount <= 0 || !Number.isInteger(orderCount)) {
      errors.OrderCount = 'Zadejte kladné celé číslo';
      isValid = false;
    }

    if (value.BtcProfitRatioPercent !== '' && 
        (isNaN(btcProfitRatioPercent) || btcProfitRatioPercent < 0 || btcProfitRatioPercent > 100)) {
      errors.BtcProfitRatioPercent = 'Zadejte procento (0-100)';
      isValid = false;
    }

    return { isValid, errors };
  }

  createDefaultValue(): SmartDistributionStrategyValue {
    return {
      type: 'SmartDistribution',
      TargetProfitPercent: '',
      OrderCount: '',
      BtcProfitRatioPercent: ''
    };
  }

  serializeForApi(value: SmartDistributionStrategyValue): any {
    return {
      type: 'SmartDistribution',
      TargetProfitPercent: Number(value.TargetProfitPercent),
      OrderCount: Number(value.OrderCount),
      BtcProfitRatioPercent: Number(value.BtcProfitRatioPercent)
    };
  }

  deserializeFromApi(apiValue: any): SmartDistributionStrategyValue {
    // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
    const targetProfitPercent = apiValue.targetProfitPercent;
    const orderCount = apiValue.orderCount;
    const btcProfitRatioPercent = apiValue.btcProfitRatioPercent;
    
    return {
      type: 'SmartDistribution',
      TargetProfitPercent: targetProfitPercent?.toString() ?? '',
      OrderCount: orderCount?.toString() ?? '',
      BtcProfitRatioPercent: btcProfitRatioPercent?.toString() ?? ''
    };
  }

  private handleFieldChange = (field: keyof Omit<SmartDistributionStrategyValue, 'type'>, newValue: string) => {
    const currentValue = this.props.value || this.createDefaultValue();
    
    // Validace čárky
    if (newValue.includes(',')) {
      return; // Ignorujeme vstup s čárkou
    }
    
    // Validace formátu podle typu pole
    if (field === 'OrderCount') {
      // Pro OrderCount pouze celá čísla
      if (newValue !== '' && !/^[1-9]\d*$/.test(newValue)) {
        return;
      }
    } else {
      // Pro ostatní pole desetinná čísla
      if (newValue !== '' && !/^\d*\.?\d*$/.test(newValue)) {
        return;
      }
    }
    
    this.handleChange({
      ...currentValue,
      [field]: newValue
    });
  };

  renderForm(): React.ReactNode {
    const value = this.props.value || this.createDefaultValue();
    
    return (
      <div>
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
              validateStatus={this.hasFieldError('TargetProfitPercent') ? 'error' : ''}
              help={this.getFieldError('TargetProfitPercent') || ''}
            >
              <Input
                placeholder="Např. 20"
                value={value.TargetProfitPercent}
                onChange={e => this.handleFieldChange('TargetProfitPercent', e.target.value)}
                status={this.hasFieldError('TargetProfitPercent') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              label="Počet orderů"
              validateStatus={this.hasFieldError('OrderCount') ? 'error' : ''}
              help={this.getFieldError('OrderCount') || ''}
            >
              <Input
                placeholder="Např. 5"
                value={value.OrderCount}
                onChange={e => this.handleFieldChange('OrderCount', e.target.value)}
                status={this.hasFieldError('OrderCount') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              label="BTC na profit (%)"
              validateStatus={this.hasFieldError('BtcProfitRatioPercent') ? 'error' : ''}
              help={this.getFieldError('BtcProfitRatioPercent') || ''}
            >
              <Input
                placeholder="Např. 80"
                value={value.BtcProfitRatioPercent}
                onChange={e => this.handleFieldChange('BtcProfitRatioPercent', e.target.value)}
                status={this.hasFieldError('BtcProfitRatioPercent') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  }
} 