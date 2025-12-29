import { ButtonHTMLAttributes, ReactNode, memo } from 'react';
import { clsx } from 'clsx';
import { ButtonVariant, Size } from './types';

/**
 * Button Component
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Supports loading state, full width, and all standard button HTML attributes.
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * // Loading state
 * <Button variant="primary" loading>
 *   Processing...
 * </Button>
 * 
 * // Full width button
 * <Button variant="primary" fullWidth>
 *   Submit
 * </Button>
 * ```
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: Size;
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Make button full width */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
  /** Render as child element (for use with Link) */
  asChild?: boolean;
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
// Use string concatenation instead of template literals to avoid Turbopack parsing issues
const createVariantStyles = (base: string[], hover: string[], focus: string[], cssVar: string) =>
  [
    ...base,
    ...hover,
    ...focus,
    '[background-color:var(--' + cssVar + ')]',
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
  sm: 'px-4 py-2 text-sm min-h-[44px]', // Ensure minimum touch target (44x44px)
  md: 'px-6 py-3 text-base min-h-[44px]',
  lg: 'px-8 py-4 text-lg min-h-[44px]',
};

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  asChild = false,
  ...props
}: ButtonProps) {
  const buttonClasses = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  // If asChild is true, render children directly (for use with Link)
  if (asChild) {
    return <>{children}</>;
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2" aria-hidden="true">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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

export default memo(Button);
