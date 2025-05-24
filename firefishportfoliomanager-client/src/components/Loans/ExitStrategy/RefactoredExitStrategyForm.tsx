import React, { useEffect, useState } from 'react';
import { Loan } from '../../../types/loanTypes';
import { 
  Radio, 
  Button, 
  Typography, 
  Alert, 
  Card,
  Spin,
  message,
  Space
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import { fetchExitStrategy, saveExitStrategy } from '../../../services/exitStrategyService';
import { useAuthStore, AuthState } from '@store/authStore';
import { ExitStrategyType } from '@/types';
import { StrategyEditorFactory, StrategyTypeInfo } from './StrategyEditorFactory';

const { Title, Text } = Typography;

interface RefactoredExitStrategyFormProps {
  loan: Loan;
  onSaved?: () => void;
}

export default function RefactoredExitStrategyForm({ loan, onSaved }: RefactoredExitStrategyFormProps) {
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);
  
  // State
  const [strategyType, setStrategyType] = useState<ExitStrategyType>('HODL');
  const [strategyValue, setStrategyValue] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Získání dostupných typů strategií z factory
  const availableStrategyTypes = StrategyEditorFactory.getAvailableStrategyTypes();

  // Načtení existující strategie
  useEffect(() => {
    setLoading(true);
    setErrors({});
    setSuccess(false);
    
    fetchExitStrategy(getAccessToken, loan.id)
      .then(data => {
        if (!data) {
          // Žádná strategie není nastavena, použijeme výchozí
          setStrategyType('HODL');
          setStrategyValue(StrategyEditorFactory.createDefaultValue('HODL'));
          return;
        }
        
        try {
          const deserializedValue = StrategyEditorFactory.deserializeFromApi(data);
          const apiStrategyType = (data as Record<string, unknown>).type;
          
          if (StrategyEditorFactory.isStrategySupported(apiStrategyType as string)) {
            setStrategyType(apiStrategyType as ExitStrategyType);
            setStrategyValue(deserializedValue);
          } else {
            throw new Error(`Unsupported strategy type: ${apiStrategyType}`);
          }
        } catch (error) {
          console.error('Error deserializing strategy:', error);
          setErrors({ general: 'Nepodařilo se načíst uloženou strategii.' });
        }
      })
      .catch((err) => {
        console.error('Chyba při načítání strategie:', err);
        setErrors({ general: 'Nepodařilo se načíst uloženou strategii.' });
      })
      .finally(() => setLoading(false));
  }, [getAccessToken, loan.id]);

  // Handler pro změnu typu strategie
  const handleTypeChange = (e: RadioChangeEvent) => {
    const newType = e.target.value as ExitStrategyType;
    setStrategyType(newType);
    setStrategyValue(StrategyEditorFactory.createDefaultValue(newType));
    setErrors({});
    setSuccess(false);
  };

  // Handler pro změnu hodnoty strategie
  const handleStrategyValueChange = (newValue: any) => {
    setStrategyValue(newValue);
    setSuccess(false);
  };

  // Handler pro změnu chyb
  const handleErrorChange = (newErrors: Record<string, string>) => {
    setErrors(newErrors);
  };

  // Uložení strategie
  const handleSave = async () => {
    setErrors({});
    setSuccess(false);

    // Validace strategie
    const validation = StrategyEditorFactory.validateStrategy(strategyType, strategyValue);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const serializedStrategy = StrategyEditorFactory.serializeForApi(strategyType, strategyValue);
      await saveExitStrategy(getAccessToken, loan.id, serializedStrategy);
      
      setSuccess(true);
      setErrors({});
      message.success('Strategie úspěšně uložena');
      
      if (onSaved) {
        onSaved();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při ukládání strategie';
      setErrors({ general: errorMessage });
      console.error('Save strategy error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !strategyValue) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
        <Spin size="large" />
        <Text style={{ marginLeft: 16 }}>Načítám strategii...</Text>
      </div>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        Typ výstupní strategie
      </Title>
      
      <Space direction="vertical" style={{ marginBottom: 16, width: '100%' }}>
        <Radio.Group onChange={handleTypeChange} value={strategyType}>
          {availableStrategyTypes.map((strategyTypeInfo: StrategyTypeInfo) => (
            <Radio key={strategyTypeInfo.type} value={strategyTypeInfo.type} style={{ display: 'block', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{strategyTypeInfo.label}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {strategyTypeInfo.description}
                </div>
              </div>
            </Radio>
          ))}
        </Radio.Group>
      </Space>

      {/* Dynamicky vytvořený editor pro aktuální typ strategie */}
      {strategyValue && StrategyEditorFactory.createEditor(strategyType, {
        value: strategyValue,
        onChange: handleStrategyValueChange,
        errors: errors,
        onErrorChange: handleErrorChange
      })}

      {errors.general && (
        <Alert 
          message={errors.general} 
          type="error" 
          style={{ marginBottom: 16, marginTop: 16 }} 
          showIcon 
        />
      )}
      
      {success && (
        <Alert 
          message="Strategie úspěšně uložena" 
          type="success" 
          style={{ marginBottom: 16, marginTop: 16 }} 
          showIcon 
        />
      )}

      <Button 
        type="primary" 
        onClick={handleSave} 
        loading={loading} 
        disabled={Object.keys(errors).length > 0}
        style={{ marginTop: 16 }}
      >
        {loading ? 'Ukládám...' : 'Uložit strategii'}
      </Button>
    </Card>
  );
} 