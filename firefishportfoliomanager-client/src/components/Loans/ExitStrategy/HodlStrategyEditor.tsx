import React from 'react';
import { Typography } from 'antd';
import { BaseStrategyEditor, StrategyValidationResult } from './BaseStrategyEditor';
import { ExitStrategyType } from '@/types';

const { Text } = Typography;

interface HodlStrategyValue {
  type: 'HODL';
}

export class HodlStrategyEditor extends BaseStrategyEditor<HodlStrategyValue> {
  readonly strategyType: ExitStrategyType = 'HODL';

  validateStrategy(value: HodlStrategyValue): StrategyValidationResult {
    // HODL strategie nemá žádné parametry k validaci
    return {
      isValid: true,
      errors: {}
    };
  }

  createDefaultValue(): HodlStrategyValue {
    return {
      type: 'HODL'
    };
  }

  serializeForApi(value: HodlStrategyValue): any {
    return {
      type: 'HODL'
    };
  }

  deserializeFromApi(apiValue: any): HodlStrategyValue {
    return {
      type: 'HODL'
    };
  }

  renderForm(): React.ReactNode {
    return (
      <div>
        <Text type="secondary">
          HODL strategie nevyžaduje žádné parametry. Při splatnosti se prodá potřebné množství BTC na splacení půjčky.
        </Text>
      </div>
    );
  }
} 