import React, { useState, useEffect } from 'react';

export interface NumericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** The numeric value to display and sync with */
  value: number;
  /** Callback for when the user enters a valid number within bounds */
  onChangeNumber: (value: number) => void;
  /** Optional unit to display next to the input */
  unit?: React.ReactNode;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChangeNumber,
  min,
  max,
  step,
  id,
  name,
  required,
  className,
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
      if (min !== undefined && parsed < Number(min)) return;
      if (max !== undefined && parsed > Number(max)) return;
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
      if (min !== undefined && newVal < Number(min)) newVal = Number(min);
      if (max !== undefined && newVal > Number(max)) newVal = Number(max);
      if (newVal !== parsed) {
        onChangeNumber(newVal);
        setInputValue(newVal.toString());
      }
      setError('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center relative">
        <input
          type="text"
          id={id}
          name={name}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          required={required}
          className={className ? `${className} py-2 pl-4` : 'block w-full border border-gray-300 rounded-lg shadow-sm py-2 pl-4 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150'}
          pattern="^\\d*\\.?\\d*$"
          inputMode="decimal"
          placeholder="Např. 1234.56 (použijte tečku)"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          {...rest}
        />
        {unit && (
          <span className="ml-2 text-gray-500 whitespace-nowrap">{unit}</span>
        )}
      </div>
      <div className="min-h-[20px]">
        {error && (
          <div id={`${id}-error`} className="text-red-600 text-xs mt-1" aria-live="polite">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default NumericInput;
