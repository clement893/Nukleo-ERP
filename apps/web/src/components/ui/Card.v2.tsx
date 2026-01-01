/**
 * Card Component V2 - Unified Variants System
 * 
 * This is the refactored Card component with a unified variant system.
 * It replaces Card, StatsCard, StatusCard, and PricingCard variants.
 * 
 * @component
 * @example
 * ```tsx
 * // Default card
 * <Card variant="default">Content</Card>
 * 
 * // Stats card
 * <Card 
 *   variant="stats"
 *   statsTitle="Total Users"
 *   statsValue="1,234"
 *   statsChange={{ value: 12, type: 'increase' }}
 *   statsIcon={<UsersIcon />}
 * />
 * 
 * // Status card
 * <Card 
 *   variant="status"
 *   statusTitle="System Online"
 *   statusDescription="All systems operational"
 *   status="success"
 * />
 * 
 * // Glassmorphism card
 * <Card variant="glass">Content</Card>
 * 
 * // Pricing card
 * <Card 
 *   variant="pricing"
 *   pricingName="Pro Plan"
 *   pricingPrice={29}
 *   pricingFeatures={['Feature 1', 'Feature 2']}
 * />
 * ```
 */

'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';
import Badge from './Badge';

export type CardVariant = 
  | 'default'      // Standard card
  | 'stats'         // Statistics card (replaces StatsCard)
  | 'status'        // Status card (replaces StatusCard)
  | 'pricing'       // Pricing card (replaces PricingCard)
  | 'glass'         // Glassmorphism effect
  | 'elevated'      // Elevated with stronger shadow
  | 'outlined'      // Outlined border style
  | 'filled';       // Filled background

export type StatusType = 'success' | 'error' | 'warning' | 'info';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Card content */
  children?: ReactNode;
  
  /** Card variant */
  variant?: CardVariant;
  
  // Standard card props
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
  
  // Stats variant props
  /** Stats title (for variant="stats") */
  statsTitle?: string;
  /** Stats value (for variant="stats") */
  statsValue?: string | number;
  /** Stats change indicator (for variant="stats") */
  statsChange?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  /** Stats icon (for variant="stats") */
  statsIcon?: ReactNode;
  /** Stats trend component (for variant="stats") */
  statsTrend?: ReactNode;
  
  // Status variant props
  /** Status title (for variant="status") */
  statusTitle?: string;
  /** Status description (for variant="status") */
  statusDescription?: string;
  /** Status type (for variant="status") */
  status?: StatusType;
  
  // Pricing variant props
  /** Pricing plan name (for variant="pricing") */
  pricingName?: string;
  /** Pricing plan description (for variant="pricing") */
  pricingDescription?: string;
  /** Pricing amount (for variant="pricing") */
  pricingPrice?: number;
  /** Pricing currency (for variant="pricing") */
  pricingCurrency?: string;
  /** Pricing interval (for variant="pricing") */
  pricingInterval?: string;
  /** Pricing features list (for variant="pricing") */
  pricingFeatures?: string[];
  /** Is popular plan (for variant="pricing") */
  pricingPopular?: boolean;
  /** Pricing button text (for variant="pricing") */
  pricingButtonText?: string;
  /** Pricing button action (for variant="pricing") */
  pricingButtonAction?: () => void;
}

/**
 * Get variant-specific CSS classes
 */
function getVariantClasses(variant: CardVariant, hasGlassClass: boolean): string {
  const baseClasses = 'rounded-lg border shadow-sm';
  
  switch (variant) {
    case 'glass':
      return clsx(
        baseClasses,
        'glass-card' // Use CSS class from globals.css
      );
    
    case 'elevated':
      return clsx(
        baseClasses,
        'bg-[var(--color-background)]',
        'border-[var(--color-border)]',
        'shadow-lg'
      );
    
    case 'outlined':
      return clsx(
        baseClasses,
        'bg-transparent',
        'border-2 border-[var(--color-border)]',
        'shadow-none'
      );
    
    case 'filled':
      return clsx(
        baseClasses,
        'bg-[var(--color-muted)]',
        'border-[var(--color-border)]'
      );
    
    case 'stats':
      return clsx(
        baseClasses,
        'bg-[var(--color-background)]',
        'border-[var(--color-border)]',
        'shadow-md'
      );
    
    case 'status':
      return clsx(
        baseClasses,
        'border-2'
      );
    
    case 'pricing':
      return clsx(
        baseClasses,
        'bg-[var(--color-background)]',
        'border-[var(--color-border)]',
        'shadow-md',
        'relative'
      );
    
    case 'default':
    default:
      return clsx(
        baseClasses,
        !hasGlassClass && 'bg-[var(--color-background)]',
        'border-[var(--color-border)]'
      );
  }
}

/**
 * Get status-specific classes
 */
function getStatusClasses(status: StatusType): {
  container: string;
  title: string;
  description: string;
} {
  const statusMap = {
    success: {
      container: 'border-secondary-200 dark:border-secondary-800 bg-secondary-100 dark:bg-secondary-900',
      title: 'text-secondary-900 dark:text-secondary-100',
      description: 'text-secondary-800 dark:text-secondary-200',
    },
    error: {
      container: 'border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-900',
      title: 'text-red-900 dark:text-red-100',
      description: 'text-red-800 dark:text-red-200',
    },
    warning: {
      container: 'border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900',
      title: 'text-yellow-900 dark:text-yellow-100',
      description: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      container: 'border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-900',
      title: 'text-blue-900 dark:text-blue-100',
      description: 'text-blue-800 dark:text-blue-200',
    },
  };
  
  return statusMap[status];
}

export default function Card({
  children,
  variant = 'default',
  title,
  subtitle,
  header,
  footer,
  actions,
  className,
  hover = false,
  onClick,
  padding = true,
  // Stats props
  statsTitle,
  statsValue,
  statsChange,
  statsIcon,
  statsTrend,
  // Status props
  statusTitle,
  statusDescription,
  status = 'success',
  // Pricing props
  pricingName,
  pricingDescription,
  pricingPrice,
  pricingCurrency = '$',
  pricingInterval = '/month',
  pricingFeatures = [],
  pricingPopular = false,
  pricingButtonText = 'Select Plan',
  pricingButtonAction,
  ...props
}: CardProps) {
  const { theme } = useGlobalTheme();
  const cardConfig = theme?.config?.components?.card;
  const cardPaddingConfig = cardConfig?.padding;
  
  const cardFooter = footer || actions;
  const ariaLabel = onClick && !title ? 'Clickable card' : undefined;
  
  // Check if glass variant or glass class is present
  const hasGlassClass = variant === 'glass' || className?.includes('glass-card') || className?.includes('glass-');
  
  // Get card padding
  const getCardPadding = () => {
    if (!cardPaddingConfig) {
      return 'p-lg';
    }
    const paddingSize = 'md';
    const paddingValue = cardPaddingConfig[paddingSize] || cardPaddingConfig.md || '1.5rem';
    return paddingValue;
  };
  
  const cardPadding = getCardPadding();
  const useThemePadding = typeof cardPadding === 'string' && cardPadding !== 'p-lg';
  
  // Render stats variant
  if (variant === 'stats') {
    return (
      <div
        className={clsx(
          getVariantClasses('stats', false),
          className
        )}
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
        } as React.CSSProperties}
        {...props}
      >
        <div className={clsx(padding && !useThemePadding && 'p-6', padding && useThemePadding && 'p-[var(--card-padding)]')}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {statsTitle && (
                <p className="text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
                  {statsTitle}
                </p>
              )}
              {statsValue !== undefined && (
                <p className="text-2xl font-bold text-[var(--color-foreground)]">
                  {statsValue}
                </p>
              )}
              {statsChange && (
                <div className="mt-2 flex items-center">
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      statsChange.type === 'increase'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-error-600 dark:text-error-400'
                    )}
                  >
                    {statsChange.type === 'increase' ? '↑' : '↓'} {Math.abs(statsChange.value)}%
                  </span>
                  {statsChange.period && (
                    <span className="ml-2 text-sm text-[var(--color-muted-foreground)]">
                      vs {statsChange.period}
                    </span>
                  )}
                </div>
              )}
              {statsTrend && <div className="mt-2">{statsTrend}</div>}
            </div>
            {statsIcon && (
              <div className="ml-4 flex-shrink-0 text-primary-600 dark:text-primary-400">
                {statsIcon}
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    );
  }
  
  // Render status variant
  if (variant === 'status') {
    const statusClasses = getStatusClasses(status);
    return (
      <div
        className={clsx(
          getVariantClasses('status', false),
          statusClasses.container,
          className
        )}
        {...props}
      >
        <div className={clsx(padding && !useThemePadding && 'p-4', padding && useThemePadding && 'p-[var(--card-padding)]')}>
          {statusTitle && (
            <p className={clsx('font-semibold', statusClasses.title)}>
              {statusTitle}
            </p>
          )}
          {statusDescription && (
            <p className={clsx('text-sm mt-1', statusClasses.description)}>
              {statusDescription}
            </p>
          )}
          {children}
        </div>
      </div>
    );
  }
  
  // Render pricing variant
  if (variant === 'pricing') {
    return (
      <div
        className={clsx(
          getVariantClasses('pricing', false),
          pricingPopular && 'border-2 border-primary shadow-xl scale-105',
          className
        )}
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: pricingPopular ? 'var(--color-primary-500)' : 'var(--color-border)',
        } as React.CSSProperties}
        {...props}
      >
        {pricingPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge variant="success" className="px-4 py-1">
              Most Popular
            </Badge>
          </div>
        )}
        <div className={clsx(padding && !useThemePadding && 'p-8', padding && useThemePadding && 'p-[var(--card-padding)]')}>
          {pricingName && (
            <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
              {pricingName}
            </h2>
          )}
          {pricingDescription && (
            <p className="text-[var(--color-muted-foreground)] mb-6">
              {pricingDescription}
            </p>
          )}
          {pricingPrice !== undefined && (
            <div className="mb-6">
              <span className="text-4xl font-bold text-[var(--color-foreground)]">
                {pricingCurrency}{pricingPrice}
              </span>
              <span className="text-[var(--color-muted-foreground)]">
                {pricingInterval}
              </span>
            </div>
          )}
          {pricingButtonAction && (
            <button
              onClick={pricingButtonAction}
              className={clsx(
                'w-full mb-6 px-4 py-2 rounded-lg font-medium transition-colors',
                pricingPopular
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-transparent border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)]'
              )}
            >
              {pricingButtonText}
            </button>
          )}
          {pricingFeatures.length > 0 && (
            <ul className="space-y-3">
              {pricingFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-success-500 mr-2">✓</span>
                  <span className="text-[var(--color-foreground)]">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          {children}
        </div>
      </div>
    );
  }
  
  // Render default and other variants
  return (
    <div
      className={clsx(
        getVariantClasses(variant, hasGlassClass),
        hover && 'transition-all hover:shadow-md',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
        className
      )}
      style={{
        // Glassmorphism support
        ...(hasGlassClass ? {
          backgroundColor: 'var(--glassmorphism-card-background, color-mix(in srgb, var(--color-background) 75%, transparent))',
          backdropFilter: 'var(--glassmorphism-card-backdrop-blur, var(--glassmorphism-backdrop, blur(12px)))',
          WebkitBackdropFilter: 'var(--glassmorphism-card-backdrop-blur, var(--glassmorphism-backdrop, blur(12px)))',
          borderColor: 'var(--glassmorphism-card-border, color-mix(in srgb, var(--color-border, var(--color-foreground)) 20%, transparent))',
          boxShadow: 'var(--glassmorphism-shadow, 0 8px 32px 0 color-mix(in srgb, var(--color-foreground) 7%, transparent), inset 0 1px 0 0 color-mix(in srgb, var(--color-background) 50%, transparent))',
        } : variant !== 'outlined' && variant !== 'filled' ? {
          backgroundColor: 'var(--glassmorphism-card-background, var(--color-background))',
          backdropFilter: 'var(--glassmorphism-card-backdrop-blur, var(--glassmorphism-backdrop, none))',
          WebkitBackdropFilter: 'var(--glassmorphism-card-backdrop-blur, var(--glassmorphism-backdrop, none))',
          borderColor: 'var(--glassmorphism-card-border, var(--color-border))',
          boxShadow: 'var(--glassmorphism-shadow, var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)))',
        } : {}),
      } as React.CSSProperties}
      onClick={onClick ? (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isInteractive = target.tagName === 'BUTTON' || 
                              target.tagName === 'A' || 
                              target.closest('button') !== null ||
                              target.closest('a') !== null;
        
        if (!isInteractive) {
          onClick();
        }
      } : undefined}
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
          className={clsx(
            'border-b border-[var(--color-border)]',
            !useThemePadding && 'px-lg py-md'
          )}
          style={useThemePadding ? {
            paddingLeft: cardPadding,
            paddingRight: cardPadding,
            paddingTop: cardPadding,
            paddingBottom: cardPadding,
          } : undefined}
        >
          {header || (
            <>
              {title && (
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div 
        className={clsx(
          padding && !useThemePadding && cardPadding
        )}
        style={padding && useThemePadding ? {
          padding: cardPadding,
        } : undefined}
      >
        {children}
      </div>

      {cardFooter && (
        <div 
          className={clsx(
            'border-t border-[var(--color-border)] bg-[var(--color-muted)]',
            !useThemePadding && 'px-lg py-md'
          )}
          style={useThemePadding ? {
            paddingLeft: cardPadding,
            paddingRight: cardPadding,
            paddingTop: cardPadding,
            paddingBottom: cardPadding,
          } : undefined}
        >
          {cardFooter}
        </div>
      )}
    </div>
  );
}
