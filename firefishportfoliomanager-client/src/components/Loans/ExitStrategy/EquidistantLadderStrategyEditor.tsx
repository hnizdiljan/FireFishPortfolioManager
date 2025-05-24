import React from 'react';
import { Input, Form, Select, Typography, Row, Col } from 'antd';
import { BaseStrategyEditor, StrategyValidationResult } from './BaseStrategyEditor';
import { ExitStrategyType } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

interface EquidistantLadderStrategyValue {
  type: 'EquidistantLadder';
  startPriceCzk: string;
  endPriceCzk: string;
  orderCount: string;
  distributionType: string;
}

export class EquidistantLadderStrategyEditor extends BaseStrategyEditor<EquidistantLadderStrategyValue> {
  readonly strategyType: ExitStrategyType = 'EquidistantLadder';

  validateStrategy(value: EquidistantLadderStrategyValue): StrategyValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validace počáteční ceny
    const startPrice = Number(value.startPriceCzk);
    if (!value.startPriceCzk || startPrice <= 0) {
      errors.startPriceCzk = 'Zadejte kladnou počáteční cenu';
      isValid = false;
    }

    // Validace konečné ceny
    const endPrice = Number(value.endPriceCzk);
    if (!value.endPriceCzk || endPrice <= 0) {
      errors.endPriceCzk = 'Zadejte kladnou konečnou cenu';
      isValid = false;
    }

    // Kontrola že konečná cena je vyšší než počáteční
    if (startPrice > 0 && endPrice > 0 && endPrice <= startPrice) {
      errors.endPriceCzk = 'Konečná cena musí být vyšší než počáteční cena';
      isValid = false;
    }

    // Validace počtu orderů
    const orderCount = Number(value.orderCount);
    if (!value.orderCount || orderCount <= 0 || !Number.isInteger(orderCount)) {
      errors.orderCount = 'Zadejte celé kladné číslo';
      isValid = false;
    } else if (orderCount > 100) {
      errors.orderCount = 'Počet orderů nesmí překročit 100';
      isValid = false;
    }

    // Validace typu distribuce
    if (!value.distributionType) {
      errors.distributionType = 'Vyberte typ distribuce';
      isValid = false;
    }

    return { isValid, errors };
  }

  createDefaultValue(): EquidistantLadderStrategyValue {
    return {
      type: 'EquidistantLadder',
      startPriceCzk: '',
      endPriceCzk: '',
      orderCount: '5',
      distributionType: 'EQUAL'
    };
  }

  serializeForApi(value: EquidistantLadderStrategyValue): any {
    return {
      type: 'EquidistantLadder',
      StartPriceCzk: Number(value.startPriceCzk),
      EndPriceCzk: Number(value.endPriceCzk),
      OrderCount: Number(value.orderCount),
      DistributionType: value.distributionType
    };
  }

  deserializeFromApi(apiValue: any): EquidistantLadderStrategyValue {
    return {
      type: 'EquidistantLadder',
      startPriceCzk: apiValue.startPriceCzk?.toString() ?? '',
      endPriceCzk: apiValue.endPriceCzk?.toString() ?? '',
      orderCount: apiValue.orderCount?.toString() ?? '5',
      distributionType: apiValue.distributionType ?? 'EQUAL'
    };
  }

  private handleFieldChange = (field: keyof EquidistantLadderStrategyValue, newValue: string) => {
    const currentValue = this.props.value || this.createDefaultValue();

    // Validace čárky pro číselné fieldy
    if ((field === 'startPriceCzk' || field === 'endPriceCzk' || field === 'orderCount') && newValue.includes(',')) {
      return; // Ignorujeme vstup s čárkou
    }

    // Validace formátu čísla pro číselné fieldy
    if (field === 'startPriceCzk' || field === 'endPriceCzk') {
      if (newValue !== '' && !/^\d*\.?\d*$/.test(newValue)) {
        return; // Ignorujeme nevalidní vstup
      }
    }

    // Validace celého čísla pro orderCount
    if (field === 'orderCount') {
      if (newValue !== '' && !/^\d+$/.test(newValue)) {
        return; // Ignorujeme nevalidní vstup
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
        <Title level={5} style={{ marginBottom: 16 }}>Nastavení ekvidistančního žebříku:</Title>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Počáteční cena (CZK/BTC)"
              validateStatus={this.hasFieldError('startPriceCzk') ? 'error' : ''}
              help={this.getFieldError('startPriceCzk') || 'Cena prvního sell orderu'}
            >
              <Input
                placeholder="Např. 1500000"
                value={value.startPriceCzk}
                onChange={e => this.handleFieldChange('startPriceCzk', e.target.value)}
                status={this.hasFieldError('startPriceCzk') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item 
              label="Konečná cena (CZK/BTC)"
              validateStatus={this.hasFieldError('endPriceCzk') ? 'error' : ''}
              help={this.getFieldError('endPriceCzk') || 'Cena posledního sell orderu'}
            >
              <Input
                placeholder="Např. 3000000"
                value={value.endPriceCzk}
                onChange={e => this.handleFieldChange('endPriceCzk', e.target.value)}
                status={this.hasFieldError('endPriceCzk') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Počet orderů"
              validateStatus={this.hasFieldError('orderCount') ? 'error' : ''}
              help={this.getFieldError('orderCount') || 'Kolik sell orderů vytvořit'}
            >
              <Input
                placeholder="Např. 5"
                value={value.orderCount}
                onChange={e => this.handleFieldChange('orderCount', e.target.value)}
                status={this.hasFieldError('orderCount') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item 
              label="Typ distribuce BTC"
              validateStatus={this.hasFieldError('distributionType') ? 'error' : ''}
              help={this.getFieldError('distributionType') || 'Jak rozdělit BTC mezi ordery'}
            >
              <Select
                placeholder="Vyberte typ distribuce"
                value={value.distributionType}
                onChange={(newValue) => this.handleFieldChange('distributionType', newValue)}
                status={this.hasFieldError('distributionType') ? 'error' : ''}
              >
                <Option value="EQUAL">Rovnoměrně - stejné množství BTC v každém orderu</Option>
                <Option value="DECREASING">Klesající - více BTC při nižších cenách</Option>
                <Option value="INCREASING">Rostoucí - více BTC při vyšších cenách</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 6 }}>
          <Text type="secondary">
            <strong>Popis:</strong> Ekvidistanční žebřík automaticky vytvoří ordery s rovnoměrně rozloženými cenami 
            mezi počáteční a konečnou cenou. Můžete zvolit, jak se má BTC rozdělit mezi jednotlivé ordery.
          </Text>
        </div>
      </div>
    );
  }
} 