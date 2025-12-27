/**
 * Card Component
 * 
 * Versatile card component for displaying content with optional header, footer, and actions.
 * Supports hover effects, click handlers, and dark mode.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <p>Card content</p>
 * </Card>
 * ```
 * 
 * @example
 * ```tsx
 * // Card with title and subtitle
 * <Card title="Card Title" subtitle="Subtitle">
 *   <p>Card content</p>
 * </Card>
 * ```
 * 
 * @example
 * ```tsx
 * // Card with actions in footer
 * <Card 
 *   title="Card Title"
 *   footer={<Button>Action</Button>}
 * >
 *   <p>Card content</p>
 * </Card>
 * ```
 * 
 * @example
 * ```tsx
 * // Clickable card with hover effect
 * <Card 
 *   title="Clickable Card"
 *   hover
 *   onClick={() => logger.log('Card clicked')}
 * >
 *   <p>Click me!</p>
 * </Card>
 * ```
 * 
 * @example
 * ```tsx
 * // Card with custom header
 * <Card 
 *   header={
 *     <div className="flex items-center justify-between">
 *       <h3>Custom Header</h3>
 *       <Badge>New</Badge>
 *     </div>
 *   }
 * >
 *   <p>Content with custom header</p>
 * </Card>
 * ```
 * 
 * @param {CardProps} props - Component props
 * @param {ReactNode} props.children - Card content (required)
 * @param {string} [props.title] - Card title displayed in header
 * @param {string} [props.subtitle] - Card subtitle displayed below title
 * @param {ReactNode} [props.header] - Custom header content (overrides title/subtitle)
 * @param {ReactNode} [props.footer] - Footer content (buttons, actions, etc.)
 * @param {ReactNode} [props.actions] - Alias for footer prop
 * @param {boolean} [props.hover=false] - Enable hover shadow effect
 * @param {() => void} [props.onClick] - Click handler (makes card clickable)
 * @param {boolean} [props.padding=true] - Add padding to card content
 * @param {string} [props.className] - Additional CSS classes
 * 
 * @returns {JSX.Element} Card component
 * 
 * @see {@link https://tailwindcss.com/docs/box-shadow} Tailwind shadow utilities
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
  
  // Generate aria-label for clickable cards without title
  const ariaLabel = onClick && !title ? 'Clickable card' : undefined;
  
  return (
    <div
      className={clsx(
        'rounded-lg border shadow-sm',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
        hover && 'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
        className
      )}
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={onClick ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...props}
    >
      {(title || subtitle || header) && (
        <div 
          className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {header || (
            <>
              {title && (
                <h3 
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p 
                  className="mt-1 text-sm text-gray-700 dark:text-gray-300"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className={clsx(padding && 'p-6')}>{children}</div>

      {cardFooter && (
        <div 
          className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/70"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-muted)',
          }}
        >
          {cardFooter}
        </div>
      )}
    </div>
  );
}
