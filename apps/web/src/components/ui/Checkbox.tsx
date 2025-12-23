import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      className,
      fullWidth = false,
      indeterminate = false,
      checked,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        <label className="flex items-center cursor-pointer group">
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              if (node) {
                node.indeterminate = indeterminate;
              }
            }}
            type="checkbox"
            checked={checked}
            className={clsx(
              'w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded',
              'bg-white dark:bg-gray-700',
              'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 dark:border-red-400',
              className
            )}
            {...props}
          />
          {label && (
            <span className={clsx(
              'ml-2 text-sm font-medium',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
              props.disabled && 'opacity-50'
            )}>
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;

