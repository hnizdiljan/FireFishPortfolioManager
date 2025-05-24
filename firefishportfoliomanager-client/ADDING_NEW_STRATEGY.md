# Přidání nové Exit Strategie

Tento dokument popisuje, jak přidat novou exit strategii do aplikace. Aplikace používá **Strategy Pattern** a **Factory Pattern** pro snadné rozšiřování.

## Kroky pro přidání nové strategie

### 1. Backend - Přidání nového typu strategie

#### 1.1 Aktualizace enum typu
V souboru `FireFishPortfolioManager.Api/Models/Strategy.cs`:

```csharp
[JsonConverter(typeof(StringEnumConverter))]
public enum ExitStrategyType
{
    HODL,
    CustomLadder,
    SmartDistribution,
    NewStrategyType  // <-- Přidat nový typ
}
```

#### 1.2 Vytvoření nové strategy třídy
V souboru `FireFishPortfolioManager.Api/Models/Strategy.cs`:

```csharp
public class NewExitStrategy : ExitStrategyBase
{
    public override ExitStrategyType Type => ExitStrategyType.NewStrategyType;
    
    // Přidat parametry specifické pro novou strategii
    public decimal SomeParameter { get; set; }
    public int AnotherParameter { get; set; }
}
```

#### 1.3 Aktualizace JSON serializace
V souboru `FireFishPortfolioManager.Api/Models/Strategy.cs`:

```csharp
[KnownType(typeof(HodlExitStrategy))]
[KnownType(typeof(CustomLadderExitStrategy))]
[KnownType(typeof(SmartDistributionExitStrategy))]
[KnownType(typeof(NewExitStrategy))]  // <-- Přidat
[JsonConverter(typeof(JsonSubtypes), "Type")]
[JsonSubtypes.KnownSubType(typeof(HodlExitStrategy), "HODL")]
[JsonSubtypes.KnownSubType(typeof(CustomLadderExitStrategy), "CustomLadder")]
[JsonSubtypes.KnownSubType(typeof(SmartDistributionExitStrategy), "SmartDistribution")]
[JsonSubtypes.KnownSubType(typeof(NewExitStrategy), "NewStrategyType")]  // <-- Přidat
public abstract class ExitStrategyBase
```

#### 1.4 Vytvoření sell order generátoru
Vytvořit nový soubor `FireFishPortfolioManager.Api/Services/Strategies/NewStrategySellOrderGenerator.cs`:

```csharp
using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services.Strategies
{
    public class NewStrategySellOrderGenerator : ISellOrderGenerator
    {
        public ExitStrategyType SupportedStrategyType => ExitStrategyType.NewStrategyType;

        public List<SellOrder> GenerateSellOrders(Loan loan, ExitStrategyBase strategy, decimal currentBtcPrice)
        {
            if (strategy is not NewExitStrategy newStrategy)
            {
                throw new ArgumentException($"Strategy must be of type {nameof(NewExitStrategy)}", nameof(strategy));
            }

            // Implementovat logiku generování sell orderů
            var orders = new List<SellOrder>();
            // ... logika ...
            return orders;
        }

        public bool ValidateStrategy(ExitStrategyBase strategy, out string? error)
        {
            error = null;
            
            if (strategy is not NewExitStrategy newStrategy)
            {
                error = $"Strategy must be of type {nameof(NewExitStrategy)}";
                return false;
            }

            // Implementovat validaci parametrů
            // ... validace ...
            
            return true;
        }
    }
}
```

#### 1.5 Registrace v factory
V souboru `FireFishPortfolioManager.Api/Services/SellOrderGeneratorFactory.cs`:

```csharp
private void RegisterGenerators()
{
    var generators = new ISellOrderGenerator[]
    {
        new HodlSellOrderGenerator(),
        new CustomLadderSellOrderGenerator(),
        new SmartDistributionSellOrderGenerator(),
        new NewStrategySellOrderGenerator()  // <-- Přidat
    };

    foreach (var generator in generators)
    {
        _generators[generator.SupportedStrategyType] = generator;
    }
}
```

#### 1.6 Aktualizace popisů
V souboru `FireFishPortfolioManager.Api/Models/Strategy.cs`:

```csharp
public static class ExitStrategyDescriptions
{
    public const string HODL = "...";
    public const string CustomLadder = "...";
    public const string SmartDistribution = "...";
    public const string NewStrategyType = "Popis nové strategie...";  // <-- Přidat
}
```

### 2. Frontend - Přidání editoru strategie

#### 2.1 Vytvoření editoru
Vytvořit nový soubor `firefishportfoliomanager-client/src/components/Loans/ExitStrategy/NewStrategyEditor.tsx`:

```typescript
import React from 'react';
import { Input, Form, Typography } from 'antd';
import { BaseStrategyEditor, StrategyValidationResult } from './BaseStrategyEditor';
import { ExitStrategyType } from '@/types';

interface NewStrategyValue {
  type: 'NewStrategyType';
  someParameter: string;
  anotherParameter: string;
}

export class NewStrategyEditor extends BaseStrategyEditor<NewStrategyValue> {
  readonly strategyType: ExitStrategyType = 'NewStrategyType';

  validateStrategy(value: NewStrategyValue): StrategyValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Implementovat validaci
    if (!value.someParameter) {
      errors.someParameter = 'Toto pole je povinné';
      isValid = false;
    }

    return { isValid, errors };
  }

  createDefaultValue(): NewStrategyValue {
    return {
      type: 'NewStrategyType',
      someParameter: '',
      anotherParameter: ''
    };
  }

  serializeForApi(value: NewStrategyValue): any {
    return {
      type: 'NewStrategyType',
      SomeParameter: Number(value.someParameter),
      AnotherParameter: Number(value.anotherParameter)
    };
  }

  deserializeFromApi(apiValue: any): NewStrategyValue {
    return {
      type: 'NewStrategyType',
      someParameter: apiValue.SomeParameter?.toString() ?? '',
      anotherParameter: apiValue.AnotherParameter?.toString() ?? ''
    };
  }

  renderForm(): React.ReactNode {
    const value = this.props.value || this.createDefaultValue();
    
    return (
      <div>
        <Form.Item 
          label="Some Parameter"
          validateStatus={this.hasFieldError('someParameter') ? 'error' : ''}
          help={this.getFieldError('someParameter') || ''}
        >
          <Input
            placeholder="Zadejte hodnotu"
            value={value.someParameter}
            onChange={e => this.handleChange({
              ...value,
              someParameter: e.target.value
            })}
          />
        </Form.Item>
        {/* Další pole... */}
      </div>
    );
  }
}
```

#### 2.2 Registrace v factory
V souboru `firefishportfoliomanager-client/src/components/Loans/ExitStrategy/StrategyEditorFactory.tsx`:

```typescript
// Import nového editoru
import { NewStrategyEditor } from './NewStrategyEditor';

export class StrategyEditorFactory {
  private static readonly strategyTypes: StrategyTypeInfo[] = [
    // ... existující strategie ...
    {
      type: 'NewStrategyType',
      label: 'Nová Strategie',
      description: 'Popis nové strategie...'
    }
  ];

  static createEditor(type: ExitStrategyType, props: StrategyEditorProps): React.ReactElement<StrategyEditorProps> {
    switch (type) {
      // ... existující cases ...
      case 'NewStrategyType':
        return React.createElement(NewStrategyEditor, props);
      default:
        throw new Error(`Unsupported strategy type: ${type}`);
    }
  }

  static createEditorInstance(type: ExitStrategyType): BaseStrategyEditor {
    switch (type) {
      // ... existující cases ...
      case 'NewStrategyType':
        return new NewStrategyEditor({});
      default:
        throw new Error(`Unsupported strategy type: ${type}`);
    }
  }
}
```

#### 2.3 Export v index souboru
V souboru `firefishportfoliomanager-client/src/components/Loans/ExitStrategy/index.ts`:

```typescript
export { NewStrategyEditor } from './NewStrategyEditor';
```

#### 2.4 Aktualizace typů
V souboru `firefishportfoliomanager-client/src/types/index.ts` nebo příslušném type souboru:

```typescript
export type ExitStrategyType = 'HODL' | 'CustomLadder' | 'SmartDistribution' | 'NewStrategyType';
```

## Výhody tohoto přístupu

1. **SOLID principy**: Každá strategie má svou vlastní třídu s jedinou odpovědností
2. **Open/Closed principle**: Aplikace je otevřená pro rozšíření, uzavřená pro modifikaci
3. **Strategy Pattern**: Snadná výměna algoritmů za běhu
4. **Factory Pattern**: Centralizovaná správa vytváření objektů
5. **Separation of Concerns**: Validace, serializace a UI jsou oddělené
6. **Type Safety**: TypeScript zajišťuje typovou bezpečnost

## Testování

Po přidání nové strategie nezapomeňte:

1. Napsat unit testy pro backend generátor
2. Napsat unit testy pro frontend editor
3. Otestovat celý flow od UI po backend
4. Ověřit serializaci/deserializaci
5. Otestovat validaci na obou stranách

## Poznámky

- Všechny změny jsou zpětně kompatibilní
- Existující strategie nejsou ovlivněny
- Nová strategie se automaticky objeví v UI
- Factory pattern zajišťuje konzistentní chování 