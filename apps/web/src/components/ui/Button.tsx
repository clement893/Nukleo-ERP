import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

// Base styles
const baseStyles = [
  'font-medium',
  'rounded-lg',
  'transition-all',
  'duration-200',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-2',
].join(' ');

// Variant styles - Split into arrays for better readability
const createVariantStyles = (base: string[], hover: string[], focus: string[], cssVar: string) =>
  [
    ...base,
    ...hover,
    ...focus,
    `[background-color:var(--${cssVar})]`,
  ].join(' ');

const variants = {
  primary: createVariantStyles(
    ['bg-primary-600', 'dark:bg-primary-500', 'text-white'],
    ['hover:bg-primary-700', 'dark:hover:bg-primary-600'],
    ['focus:ring-primary-500', 'dark:focus:ring-primary-400'],
    'color-primary-500'
  ),
  secondary: createVariantStyles(
    ['bg-secondary-600', 'dark:bg-secondary-500', 'text-white'],
    ['hover:bg-secondary-700', 'dark:hover:bg-secondary-600'],
    ['focus:ring-secondary-500', 'dark:focus:ring-secondary-400'],
    'color-secondary-500'
  ),
  outline: [
    'border-2',
    'border-primary-600',
    'dark:border-primary-500',
    'text-primary-600',
    'dark:text-primary-400',
    'hover:bg-primary-50',
    'dark:hover:bg-primary-900/20',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
    '[border-color:var(--color-primary-500)]',
    '[color:var(--color-primary-500)]',
  ].join(' '),
  ghost: [
    'text-gray-700',
    'dark:text-gray-300',
    'hover:bg-gray-100',
    'dark:hover:bg-gray-800',
    'focus:ring-gray-500',
    'dark:focus:ring-gray-400',
  ].join(' '),
  danger: createVariantStyles(
    ['bg-danger-600', 'dark:bg-danger-500', 'text-white'],
    ['hover:bg-danger-700', 'dark:hover:bg-danger-600'],
    ['focus:ring-danger-500', 'dark:focus:ring-danger-400'],
    'color-danger-500'
  ),
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
