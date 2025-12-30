/**
 * Switch Component
 * Toggle switch component
 */

'use client';

import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';
import { useComponentConfig } from '@/lib/theme/use-component-config';

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
      id,
      checked,
      onChange,
      ...props
    },
    ref
  ) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(7)}`;
    const { getSize } = useComponentConfig('switch');
    const sizeConfig = getSize('md');
    
    const height = sizeConfig?.minHeight || '1.5rem';
    const width = `calc(${height} * 1.833)`; // Maintain aspect ratio
    const borderRadius = sizeConfig?.borderRadius || '9999px';
    const toggleSize = `calc(${height} - 4px)`; // Size of the toggle circle
    
    const [internalChecked, setInternalChecked] = useState(checked || false);
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <div className={clsx('flex items-center', fullWidth && 'w-full')}>
        <label
          htmlFor={switchId}
          className="relative inline-flex items-center cursor-pointer"
        >
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            className="sr-only"
            checked={currentChecked}
            onChange={handleChange}
            {...props}
          />
          <div
            className={clsx(
              "relative rounded-full transition-colors duration-200 ease-in-out",
              currentChecked 
                ? "bg-primary-600 dark:bg-primary-500" 
                : "bg-muted",
              error && 'ring-2 ring-error-500 dark:ring-error-400',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            style={{
              width,
              height,
              borderRadius,
            }}
          >
            <span
              className={clsx(
                "absolute top-[2px] left-[2px] bg-white border border-border rounded-full transition-transform duration-200 ease-in-out",
                currentChecked && "translate-x-full"
              )}
              style={{
                width: toggleSize,
                height: toggleSize,
              }}
            />
          </div>
          {label && (
            <span
              className={clsx(
                'ml-3 text-sm font-medium text-foreground',
                error && 'text-error-600 dark:text-error-400',
                props.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="ml-2 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
