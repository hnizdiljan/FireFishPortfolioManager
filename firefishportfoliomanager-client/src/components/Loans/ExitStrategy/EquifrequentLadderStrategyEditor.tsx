import React from 'react';
import { Input, Form, Typography, Row, Col } from 'antd';
import { BaseStrategyEditor, StrategyValidationResult } from './BaseStrategyEditor';
import { ExitStrategyType } from '@/types';

const { Title, Text } = Typography;

interface EquifrequentLadderStrategyValue {
  type: 'EquifrequentLadder';
  basePriceCzk: string;
  priceIncrementPercent: string;
  orderCount: string;
  btcPercentPerOrder: string;
}

export class EquifrequentLadderStrategyEditor extends BaseStrategyEditor<EquifrequentLadderStrategyValue> {
  readonly strategyType: ExitStrategyType = 'EquifrequentLadder';

  validateStrategy(value: EquifrequentLadderStrategyValue): StrategyValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validace základní ceny
    const basePrice = Number(value.basePriceCzk);
    if (!value.basePriceCzk || basePrice <= 0) {
      errors.basePriceCzk = 'Zadejte kladnou základní cenu';
      isValid = false;
    }

    // Validace procenta nárůstu
    const incrementPercent = Number(value.priceIncrementPercent);
    if (!value.priceIncrementPercent || incrementPercent <= 0) {
      errors.priceIncrementPercent = 'Zadejte kladné procento nárůstu';
      isValid = false;
    } else if (incrementPercent > 100) {
      errors.priceIncrementPercent = 'Procento nárůstu nesmí překročit 100%';
      isValid = false;
    }

    // Validace počtu orderů
    const orderCount = Number(value.orderCount);
    if (!value.orderCount || orderCount <= 0 || !Number.isInteger(orderCount)) {
      errors.orderCount = 'Zadejte celé kladné číslo';
      isValid = false;
    } else if (orderCount > 50) {
      errors.orderCount = 'Počet orderů nesmí překročit 50';
      isValid = false;
    }

    // Validace procenta BTC na order
    const btcPercent = Number(value.btcPercentPerOrder);
    if (!value.btcPercentPerOrder || btcPercent <= 0) {
      errors.btcPercentPerOrder = 'Zadejte kladné procento BTC';
      isValid = false;
    } else if (btcPercent > 100) {
      errors.btcPercentPerOrder = 'Procento BTC nesmí překročit 100%';
      isValid = false;
    }

    // Varování pokud celkové procento překračuje 100%
    if (orderCount > 0 && btcPercent > 0) {
      const totalPercent = orderCount * btcPercent;
      if (totalPercent > 100) {
        errors.totalPercentWarning = `Celkové procento BTC (${totalPercent.toFixed(1)}%) překračuje 100%. Množství bude automaticky upraveno.`;
        // Nejedná se o chybu, jen varování
      }
    }

    return { isValid, errors };
  }

  createDefaultValue(): EquifrequentLadderStrategyValue {
    return {
      type: 'EquifrequentLadder',
      basePriceCzk: '',
      priceIncrementPercent: '10',
      orderCount: '5',
      btcPercentPerOrder: '20'
    };
  }

  serializeForApi(value: EquifrequentLadderStrategyValue): any {
    return {
      type: 'EquifrequentLadder',
      BasePriceCzk: Number(value.basePriceCzk),
      PriceIncrementPercent: Number(value.priceIncrementPercent),
      OrderCount: Number(value.orderCount),
      BtcPercentPerOrder: Number(value.btcPercentPerOrder)
    };
  }

  deserializeFromApi(apiValue: any): EquifrequentLadderStrategyValue {
    return {
      type: 'EquifrequentLadder',
      basePriceCzk: apiValue.basePriceCzk?.toString() ?? '',
      priceIncrementPercent: apiValue.priceIncrementPercent?.toString() ?? '10',
      orderCount: apiValue.orderCount?.toString() ?? '5',
      btcPercentPerOrder: apiValue.btcPercentPerOrder?.toString() ?? '20'
    };
  }

  private handleFieldChange = (field: keyof EquifrequentLadderStrategyValue, newValue: string) => {
    const currentValue = this.props.value || this.createDefaultValue();

    // Validace čárky pro číselné fieldy
    if (newValue.includes(',')) {
      return; // Ignorujeme vstup s čárkou
    }

    // Validace formátu čísla
    if (field === 'basePriceCzk' || field === 'priceIncrementPercent' || field === 'btcPercentPerOrder') {
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
        <Title level={5} style={{ marginBottom: 16 }}>Nastavení ekvifrekvenčního žebříku:</Title>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Základní cena (CZK/BTC)"
              validateStatus={this.hasFieldError('basePriceCzk') ? 'error' : ''}
              help={this.getFieldError('basePriceCzk') || 'Výchozí cena pro první order'}
            >
              <Input
                placeholder="Např. 1500000"
                value={value.basePriceCzk}
                onChange={e => this.handleFieldChange('basePriceCzk', e.target.value)}
                status={this.hasFieldError('basePriceCzk') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item 
              label="Procento nárůstu (%)"
              validateStatus={this.hasFieldError('priceIncrementPercent') ? 'error' : ''}
              help={this.getFieldError('priceIncrementPercent') || 'O kolik % se zvýší cena každého dalšího orderu'}
            >
              <Input
                placeholder="Např. 10"
                value={value.priceIncrementPercent}
                onChange={e => this.handleFieldChange('priceIncrementPercent', e.target.value)}
                status={this.hasFieldError('priceIncrementPercent') ? 'error' : ''}
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
              label="Procento BTC na order (%)"
              validateStatus={this.hasFieldError('btcPercentPerOrder') ? 'error' : ''}
              help={this.getFieldError('btcPercentPerOrder') || 'Kolik % BTC prodat v každém orderu'}
            >
              <Input
                placeholder="Např. 20"
                value={value.btcPercentPerOrder}
                onChange={e => this.handleFieldChange('btcPercentPerOrder', e.target.value)}
                status={this.hasFieldError('btcPercentPerOrder') ? 'error' : ''}
              />
            </Form.Item>
          </Col>
        </Row>

        {this.hasFieldError('totalPercentWarning') && (
          <div style={{ color: '#faad14', marginTop: 8, padding: 8, backgroundColor: '#fffbe6', borderRadius: 4, border: '1px solid #ffe58f' }}>
            {this.getFieldError('totalPercentWarning')}
          </div>
        )}

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 6 }}>
          <Text type="secondary">
            <strong>Popis:</strong> Ekvifrekvenční žebřík vytvoří ordery s exponenciálně rostoucími cenami. 
            Každý další order má cenu o zadané procento vyšší než předchozí. 
            Např. při 10% nárůstu: 1. order 1,500,000 CZK, 2. order 1,650,000 CZK, 3. order 1,815,000 CZK atd.
          </Text>
        </div>
      </div>
    );
  }
} 