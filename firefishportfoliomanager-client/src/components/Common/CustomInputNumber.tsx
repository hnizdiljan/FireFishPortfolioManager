import React from 'react';
import { InputNumber, InputNumberProps } from 'antd';

interface CustomInputNumberProps extends Omit<InputNumberProps, 'onChange'> {
  onChange?: (value: number | null) => void;
  allowEmpty?: boolean;
}

/**
 * Vylepšená verze InputNumber, která umožňuje kompletní vymazání hodnoty
 * a nepřepisuje prázdnou hodnotu na 0
 */
const CustomInputNumber: React.FC<CustomInputNumberProps> = ({
  onChange,
  allowEmpty = true,
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState<string | number | null>(value || null);

  React.useEffect(() => {
    setInternalValue(value || null);
  }, [value]);

  const handleChange = (newValue: number | string | null) => {
    setInternalValue(newValue);
    
    if (onChange) {
      // Pokud je hodnota prázdná a allowEmpty je true, pošli null
      if ((newValue === null || newValue === '' || newValue === undefined) && allowEmpty) {
        onChange(null);
      } else {
        // Jinak pošli číselnou hodnotu nebo 0 jako fallback
        const numericValue = typeof newValue === 'number' ? newValue : parseFloat(newValue as string);
        onChange(isNaN(numericValue) ? (allowEmpty ? null : 0) : numericValue);
      }
    }
  };

  const handleBlur = () => {
    // Při opuštění pole, pokud je hodnota prázdná a allowEmpty je false, nastav 0
    if ((internalValue === null || internalValue === '' || internalValue === undefined) && !allowEmpty) {
      setInternalValue(0);
      if (onChange) {
        onChange(0);
      }
    }
  };

  return (
    <InputNumber
      {...props}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      // Použij předané formatter a parser, nebo výchozí
      parser={props.parser || ((value) => {
        if (!value || value === '') return '';
        return value.replace(/\s?[^\d.-]/g, '');
      })}
      formatter={props.formatter || ((value) => {
        if (value === null || value === undefined || value === '') return '';
        return `${value}`;
      })}
    />
  );
};

export default CustomInputNumber; 