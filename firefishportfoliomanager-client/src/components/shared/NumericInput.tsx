import React, { useState, useEffect } from 'react';
import { Input, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

const InputContainer = styled.div`
  width: 100%;
`;

const ErrorText = styled(Text)`
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  min-height: 20px;
  display: block;
`;

const UnitContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UnitText = styled(Text)`
  color: #8c8c8c;
  white-space: nowrap;
`;

export interface NumericInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  /** The numeric value to display and sync with */
  value: number;
  /** Callback for when the user enters a valid number within bounds */
  onChangeNumber: (value: number) => void;
  /** Optional unit to display next to the input */
  unit?: React.ReactNode;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step value */
  step?: number | string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChangeNumber,
  min,
  max,
  unit,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [error, setError] = useState<string>('');

  // Sync internal string state if the external value changes
  useEffect(() => {
    if (inputValue !== value.toString()) {
      setInputValue(value.toString());
    }
    // We intentionally ignore inputValue in deps here to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Zakázat čárku
    if (val.includes(',')) {
      setError('Použijte tečku jako oddělovač desetinných míst.');
      setInputValue(val.replace(/,/g, ''));

      return;
    }
    setError('');
    setInputValue(val);
    // Validace patternu
    if (!/^\d*\.?\d*$/.test(val) && val !== '') {
      setError('Zadejte pouze čísla a tečku.');

      return;
    }
    const parsed = parseFloat(val);
    // Only invoke callback for valid numeric entries within bounds
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) return;
      if (max !== undefined && parsed > max) return;
      onChangeNumber(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    // If the user cleared or entered invalid, revert to the last valid value
    if (inputValue === '' || isNaN(parsed)) {
      setInputValue(value.toString());
      setError('');
    } else {
      let newVal = parsed;
      // Clamp to bounds on blur
      if (min !== undefined && newVal < min) newVal = min;
      if (max !== undefined && newVal > max) newVal = max;
      if (newVal !== parsed) {
        onChangeNumber(newVal);
        setInputValue(newVal.toString());
      }
      setError('');
    }
  };

  const inputComponent = (
    <Input
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Např. 1234.56 (použijte tečku)"
      status={error ? 'error' : undefined}
      autoComplete="off"
      {...rest}
    />
  );

  return (
    <InputContainer>
      {unit ? (
        <UnitContainer>
          {inputComponent}
          <UnitText>{unit}</UnitText>
        </UnitContainer>
      ) : (
        inputComponent
      )}
      <ErrorText>{error}</ErrorText>
    </InputContainer>
  );
};

export default NumericInput;
