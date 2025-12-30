'use client';

import { InputHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';
import { Search, X } from 'lucide-react';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  onSearch?: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  showClearButton?: boolean;
  value?: string; // Controlled value
  onChange?: (value: string) => void; // Controlled onChange
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search...',
  fullWidth = false,
  showClearButton = true,
  value: controlledValue,
  onChange: controlledOnChange,
  className,
  ...props
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('');
  
  // Use controlled value if provided, otherwise use internal state
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (isControlled) {
      controlledOnChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
    
    onSearch?.(newValue);
  };

  const handleClear = () => {
    if (isControlled) {
      controlledOnChange?.('');
    } else {
      setInternalValue('');
    }
    onSearch?.('');
  };

  return (
    <div className={clsx('relative', fullWidth && 'w-full')}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={clsx(
          'w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent',
          className
        )}
        {...props}
      />
      {showClearButton && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

