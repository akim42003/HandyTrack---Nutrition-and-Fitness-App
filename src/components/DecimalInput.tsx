import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface DecimalInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: number | undefined;
  onChangeValue: (value: number) => void;
  allowDecimals?: boolean;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChangeValue,
  allowDecimals = true,
  ...props
}) => {
  const [localValue, setLocalValue] = useState('');
  
  // Sync external value to local state
  useEffect(() => {
    if (value === undefined || value === 0) {
      setLocalValue('');
    } else {
      setLocalValue(value.toString());
    }
  }, [value]);
  
  const handleChangeText = (text: string) => {
    // Allow empty string
    if (text === '') {
      setLocalValue('');
      onChangeValue(0);
      return;
    }
    
    // For decimal numbers, allow intermediate states
    if (allowDecimals) {
      // Allow numbers, single decimal point, and negative sign
      const regex = /^-?\d*\.?\d*$/;
      if (regex.test(text)) {
        setLocalValue(text);
        
        // Only update the value if it's a valid number
        const num = parseFloat(text);
        if (!isNaN(num)) {
          onChangeValue(num);
        }
      }
    } else {
      // For integers only
      const regex = /^\d*$/;
      if (regex.test(text)) {
        setLocalValue(text);
        const num = parseInt(text);
        if (!isNaN(num)) {
          onChangeValue(num);
        } else if (text === '') {
          onChangeValue(0);
        }
      }
    }
  };
  
  return (
    <TextInput
      {...props}
      value={localValue}
      onChangeText={handleChangeText}
      keyboardType={allowDecimals ? "numbers-and-punctuation" : "numeric"}
    />
  );
};