'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import Input from './Input';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  format?: 'date' | 'datetime-local' | 'month' | 'time' | 'week';
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      format = 'date',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Input
        ref={ref}
        type={format}
        label={label}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        className={className}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;

