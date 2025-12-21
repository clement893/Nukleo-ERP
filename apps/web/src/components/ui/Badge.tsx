import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ColorVariant, BaseComponentProps, ColorVariantProps } from './types';

interface BadgeProps extends BaseComponentProps, ColorVariantProps {
  children: ReactNode;
  variant?: ColorVariant;
}

export default function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

