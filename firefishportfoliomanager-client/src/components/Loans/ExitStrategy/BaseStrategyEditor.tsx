import React from 'react';
import { Form } from 'antd';
import { ExitStrategyType } from '@/types';

export interface StrategyEditorProps {
  value?: any;
  onChange?: (value: any) => void;
  errors?: Record<string, string>;
  onErrorChange?: (errors: Record<string, string>) => void;
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export abstract class BaseStrategyEditor<T = any> extends React.Component<StrategyEditorProps> {
  abstract readonly strategyType: ExitStrategyType;
  
  /**
   * Validuje strategii a vrací výsledek validace
   */
  abstract validateStrategy(value: T): StrategyValidationResult;
  
  /**
   * Vytvoří výchozí hodnotu pro strategii
   */
  abstract createDefaultValue(): T;
  
  /**
   * Serializuje strategii pro API
   */
  abstract serializeForApi(value: T): any;
  
  /**
   * Deserializuje strategii z API
   */
  abstract deserializeFromApi(apiValue: any): T;
  
  /**
   * Renderuje formulář pro editaci strategie
   */
  abstract renderForm(): React.ReactNode;
  
  protected handleChange = (newValue: T) => {
    const { onChange, onErrorChange } = this.props;
    
    // Validace při změně
    const validation = this.validateStrategy(newValue);
    
    if (onErrorChange) {
      onErrorChange(validation.errors);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };
  
  protected getFieldError = (fieldName: string): string | undefined => {
    return this.props.errors?.[fieldName];
  };
  
  protected hasFieldError = (fieldName: string): boolean => {
    return Boolean(this.props.errors?.[fieldName]);
  };
  
  render() {
    return (
      <Form layout="vertical">
        {this.renderForm()}
      </Form>
    );
  }
} 