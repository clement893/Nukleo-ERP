/**
 * EmptyState Component
 * 
 * Beautiful empty states that transform empty data into opportunities.
 * Uses Lucide icons and glassmorphism design.
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode | LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  // Render icon (support both ReactNode and LucideIcon)
  const renderIcon = () => {
    if (!icon) return null;
    
    // Check if it's a Lucide icon component
    const isLucideIcon = typeof icon === 'function';
    const Icon = icon as LucideIcon;

    if (variant === 'inline') {
      return isLucideIcon ? (
        <Icon className="w-5 h-5 text-muted" strokeWidth={1.5} />
      ) : (
        <div className="text-muted">{icon}</div>
      );
    }

    if (variant === 'compact') {
      return (
        <div className="glass-card p-4 rounded-xl mb-4">
          {isLucideIcon ? (
            <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
          ) : (
            <div className="w-8 h-8 text-primary-600 dark:text-primary-400">{icon}</div>
          )}
        </div>
      );
    }

    // Default variant
    return (
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-700/20 rounded-full blur-2xl" />
        <div className="relative glass-card p-6 rounded-2xl">
          {isLucideIcon ? (
            <Icon className="w-12 h-12 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
          ) : (
            <div className="w-12 h-12 text-primary-600 dark:text-primary-400">{icon}</div>
          )}
        </div>
      </div>
    );
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 py-6 px-4 text-center justify-center', className)}>
        {renderIcon()}
        <span className="text-body-sm text-muted">{title}</span>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 px-4 text-center', className)}>
        {renderIcon()}
        <h4 className="text-h6 mb-1">{title}</h4>
        {description && (
          <p className="text-caption text-muted max-w-xs">
            {description}
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {renderIcon()}
      <h3 className="text-h5 mb-2">{title}</h3>
      {description && (
        <p className="text-body-sm text-muted max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary" className="hover-lift">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Named exports for convenience
 */
export function EmptyStateCompact(props: Omit<EmptyStateProps, 'variant' | 'action'>) {
  return <EmptyState {...props} variant="compact" />;
}

export function EmptyStateInline(props: Omit<EmptyStateProps, 'variant' | 'action' | 'description'>) {
  return <EmptyState {...props} variant="inline" />;
}
