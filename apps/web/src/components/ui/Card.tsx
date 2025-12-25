/**
 * Card Component
 * 
 * Versatile card component for displaying content with optional header, footer, and actions.
 * Supports hover effects and click handlers.
 * 
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <p>Card content</p>
 * </Card>
 * 
 * // Card with title
 * <Card title="Card Title" subtitle="Subtitle">
 *   <p>Card content</p>
 * </Card>
 * 
 * // Card with actions
 * <Card 
 *   title="Card Title"
 *   footer={<Button>Action</Button>}
 * >
 *   <p>Card content</p>
 * </Card>
 * ```
 */

'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Card content */
  children: ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Custom header content */
  header?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Actions (alias for footer) */
  actions?: ReactNode;
  /** Enable hover effect */
  hover?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Add padding to card content */
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
  ...props
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
      {...props}
    >
      {(title || subtitle || header) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {header || (
            <>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{subtitle}</p>
              )}
            </>
          )}
        </div>
      )}

      <div className={clsx(padding && 'p-6')}>{children}</div>

      {cardFooter && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/70">
          {cardFooter}
        </div>
      )}
    </div>
  );
}
