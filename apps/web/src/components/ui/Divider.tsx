'use client';

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  label?: string;
}

export default function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  spacing = 'md',
  label,
  className,
  ...props
}: DividerProps) {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    lg: orientation === 'horizontal' ? 'my-8' : 'mx-8',
  };

  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  if (orientation === 'vertical') {
    return (
      <hr
        className={clsx(
          'border-0 border-l border-gray-300 dark:border-gray-600',
          variantClasses[variant],
          spacingClasses[spacing],
          'h-full',
          className
        )}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={clsx('flex items-center', spacingClasses[spacing], className)}>
        <hr
          className={clsx(
            'flex-1 border-0 border-t border-gray-300 dark:border-gray-600',
            variantClasses[variant]
          )}
          role="separator"
          aria-label={label}
        />
        <span className="px-4 text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <hr
          className={clsx(
            'flex-1 border-0 border-t border-gray-300 dark:border-gray-600',
            variantClasses[variant]
          )}
          role="separator"
        />
      </div>
    );
  }

  return (
    <hr
      className={clsx(
        'border-0 border-t border-gray-300 dark:border-gray-600',
        variantClasses[variant],
        spacingClasses[spacing],
        className
      )}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
}
