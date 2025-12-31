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
  variant?: 'default' | 'glass';
}

export default function SearchBar({
  onSearch,
  placeholder = 'Rechercher...',
  fullWidth = false,
  showClearButton = true,
  value: controlledValue,
  onChange: controlledOnChange,
  variant = 'glass',
  className,
  ...props
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
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

  const baseClasses = clsx(
    'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium',
    'text-foreground placeholder-muted-foreground',
    'transition-all duration-200',
    'focus:outline-none',
    fullWidth && 'w-full'
  );

  const variantClasses = {
    default: 'border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary',
    glass: clsx(
      'glass-input border-0',
      isFocused && 'ring-2 ring-primary/20'
    ),
  };

  return (
    <div className={clsx('relative', fullWidth ? 'w-full' : 'min-w-[280px]', className)}>
      {/* Search Icon */}
      <div className={clsx(
        'absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors',
        isFocused ? 'text-primary' : 'text-muted-foreground'
      )}>
        <Search className="w-4 h-4" />
      </div>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={clsx(baseClasses, variantClasses[variant])}
        {...props}
      />

      {/* Clear Button */}
      {showClearButton && value && (
        <button
          onClick={handleClear}
          className={clsx(
            'absolute right-3 top-1/2 transform -translate-y-1/2',
            'p-1 rounded-lg transition-all duration-200',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-foreground/10'
          )}
          aria-label="Effacer la recherche"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
