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
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={clsx(
          'w-full pl-10 pr-10 py-2 border border-border rounded-md bg-background text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          className
        )}
        {...props}
      />
      {showClearButton && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

