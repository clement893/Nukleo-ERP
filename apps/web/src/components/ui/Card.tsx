/**
 * Card Component
 * Versatile card component for displaying content
 */

'use client';

import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode; // Alias for footer
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  header,
  footer,
  actions,
  className,
  hover = false,
  onClick,
  padding = true,
}: CardProps) {
  // Use actions as footer if footer is not provided
  const cardFooter = footer || actions;
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'shadow-sm',
        hover && 'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle || header) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {header || (
            <>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
              )}
            </>
          )}
        </div>
      )}

      <div className={clsx(padding && 'p-6')}>{children}</div>

      {cardFooter && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {cardFooter}
        </div>
      )}
    </div>
  );
}
