import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
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

