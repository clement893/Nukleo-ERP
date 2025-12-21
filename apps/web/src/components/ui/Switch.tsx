'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      error,
      className,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only"
              {...props}
            />
            <div
              className={clsx(
                'w-11 h-6 rounded-full transition-colors duration-200',
                props.checked
                  ? 'bg-blue-600'
                  : 'bg-gray-300',
                props.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={clsx(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full',
                  'transition-transform duration-200 shadow-md',
                  props.checked && 'transform translate-x-5'
                )}
              />
            </div>
          </div>
          {label && (
            <span className={clsx(
              'ml-3 text-sm font-medium',
              error ? 'text-red-600' : 'text-gray-700',
              props.disabled && 'opacity-50'
            )}>
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;

