import React, { useState, useEffect } from 'react';

export interface NumericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** The numeric value to display and sync with */
  value: number;
  /** Callback for when the user enters a valid number within bounds */
  onChangeNumber: (value: number) => void;
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
  ...rest
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

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
    setInputValue(val);
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
    } else {
      let newVal = parsed;
      // Clamp to bounds on blur
      if (min !== undefined && newVal < Number(min)) newVal = Number(min);
      if (max !== undefined && newVal > Number(max)) newVal = Number(max);
      if (newVal !== parsed) {
        onChangeNumber(newVal);
        setInputValue(newVal.toString());
      }
    }
  };

  return (
    <input
      type="number"
      id={id}
      name={name}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      required={required}
      className={className}
      {...rest}
    />
  );
};

export default NumericInput;
