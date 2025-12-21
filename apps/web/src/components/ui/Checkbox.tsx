import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
          <input
            ref={ref}
            type="checkbox"
            className={clsx(
              'w-4 h-4 text-blue-600 border-gray-300 rounded',
              'focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          {label && (
            <span className={clsx(
              'ml-2 text-sm font-medium',
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;

