import React from 'react';
import { Button, Input, Row, Col, Form, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { BaseStrategyEditor, StrategyValidationResult } from './BaseStrategyEditor';
import { ExitStrategyType } from '@/types';

const { Title } = Typography;

interface CustomLadderOrder {
  TargetPriceCzk: string;
  PercentToSell: string;
}

interface CustomLadderStrategyValue {
  type: 'CustomLadder';
  Orders: CustomLadderOrder[];
}

export class CustomLadderStrategyEditor extends BaseStrategyEditor<CustomLadderStrategyValue> {
  readonly strategyType: ExitStrategyType = 'CustomLadder';

  validateStrategy(value: CustomLadderStrategyValue): StrategyValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!value.Orders || value.Orders.length === 0) {
      errors.orders = 'Musí být zadán alespoň jeden order.';
      isValid = false;
    } else {
      let totalPercent = 0;
      
      value.Orders.forEach((order, idx) => {
        const price = Number(order.TargetPriceCzk);
        const percent = Number(order.PercentToSell);
        
        if (!price || price <= 0) {
          errors[`order_${idx}_price`] = 'Zadejte kladnou cenu';
          isValid = false;
        }
        
        if (!percent || percent <= 0 || percent > 100) {
          errors[`order_${idx}_percent`] = 'Zadejte procento (1-100)';
          isValid = false;
        }
        
        totalPercent += percent;
      });
      
      if (totalPercent > 100) {
        errors.totalPercent = `Celkový součet procent nesmí přesáhnout 100% (aktuálně ${totalPercent.toFixed(2)}%)`;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  createDefaultValue(): CustomLadderStrategyValue {
    return {
      type: 'CustomLadder',
      Orders: [
        { TargetPriceCzk: '', PercentToSell: '' }
      ]
    };
  }

  serializeForApi(value: CustomLadderStrategyValue): any {
    return {
      type: 'CustomLadder',
      Orders: value.Orders.map(order => ({
        TargetPriceCzk: Number(order.TargetPriceCzk),
        PercentToSell: Number(order.PercentToSell)
      }))
    };
  }

  deserializeFromApi(apiValue: any): CustomLadderStrategyValue {
    // API nyní vrací camelCase díky CamelCasePropertyNamesContractResolver
    const ordersArray = apiValue.orders as Array<any> | undefined;
    
    const orders = ordersArray?.map((o: any) => ({
      TargetPriceCzk: o.targetPriceCzk?.toString() ?? '',
      PercentToSell: o.percentToSell?.toString() ?? ''
    })) || [];
    
    return {
      type: 'CustomLadder',
      Orders: orders.length > 0 ? orders : this.createDefaultValue().Orders
    };
  }

  private handleOrderChange = (idx: number, field: 'TargetPriceCzk' | 'PercentToSell', newValue: string) => {
    const currentValue = this.props.value || this.createDefaultValue();
    
    // Validace čárky
    if (newValue.includes(',')) {
      return; // Ignorujeme vstup s čárkou
    }
    
    // Validace formátu čísla
    if (newValue !== '' && !/^\d*\.?\d*$/.test(newValue)) {
      return; // Ignorujeme nevalidní vstup
    }
    
        const updatedOrders = currentValue.Orders.map((order: CustomLadderOrder, i: number) =>       i === idx ? { ...order, [field]: newValue } : order    );
    
    this.handleChange({
      ...currentValue,
      Orders: updatedOrders
    });
  };

  private handleAddOrder = () => {
    const currentValue = this.props.value || this.createDefaultValue();
    
    this.handleChange({
      ...currentValue,
      Orders: [...currentValue.Orders, { TargetPriceCzk: '', PercentToSell: '' }]
    });
  };

  private handleRemoveOrder = (idx: number) => {
    const currentValue = this.props.value || this.createDefaultValue();
    
    this.handleChange({
      ...currentValue,
      Orders: currentValue.Orders.filter((_: CustomLadderOrder, i: number) => i !== idx)
    });
  };

  renderForm(): React.ReactNode {
    const value = this.props.value || this.createDefaultValue();
    
    return (
      <div>
        <Title level={5} style={{ marginBottom: 16 }}>Custom Ladder ordery:</Title>
        
        {value.Orders.map((order: CustomLadderOrder, idx: number) => (
          <Row key={idx} gutter={16} style={{ marginBottom: 16, alignItems: 'flex-start' }}>
            <Col flex="1">
              <Form.Item 
                label="Cílová cena (CZK/BTC)"
                style={{ marginBottom: 0 }}
                validateStatus={this.hasFieldError(`order_${idx}_price`) ? 'error' : ''}
                help={this.getFieldError(`order_${idx}_price`) || ''}
              >
                <Input
                  placeholder="Např. 2500000"
                  value={order.TargetPriceCzk}
                  onChange={e => this.handleOrderChange(idx, 'TargetPriceCzk', e.target.value)}
                  status={this.hasFieldError(`order_${idx}_price`) ? 'error' : ''}
                />
              </Form.Item>
            </Col>
            <Col flex="1">
              <Form.Item 
                label="Procento k prodeji (%)"
                style={{ marginBottom: 0 }}
                validateStatus={this.hasFieldError(`order_${idx}_percent`) ? 'error' : ''}
                help={this.getFieldError(`order_${idx}_percent`) || ''}
              >
                <Input
                  placeholder="Např. 25"
                  value={order.PercentToSell}
                  onChange={e => this.handleOrderChange(idx, 'PercentToSell', e.target.value)}
                  status={this.hasFieldError(`order_${idx}_percent`) ? 'error' : ''}
                />
              </Form.Item>
            </Col>
            {value.Orders.length > 1 && (
              <Col>
                <Form.Item label=" " style={{ marginBottom: 0 }}>
                  <Button 
                    icon={<DeleteOutlined />} 
                    onClick={() => this.handleRemoveOrder(idx)} 
                    danger
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        ))}
        
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          onClick={this.handleAddOrder} 
          style={{ marginTop: 8 }}
        >
          Přidat order
        </Button>
        
        {this.hasFieldError('orders') && (
          <div style={{ color: '#ff4d4f', marginTop: 8 }}>
            {this.getFieldError('orders')}
          </div>
        )}
        
        {this.hasFieldError('totalPercent') && (
          <div style={{ color: '#ff4d4f', marginTop: 8 }}>
            {this.getFieldError('totalPercent')}
          </div>
        )}
      </div>
    );
  }
} 