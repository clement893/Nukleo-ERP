/**
 * Textarea Component
 * Multi-line text input component
 */

'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useComponentConfig } from '@/lib/theme/use-component-config';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      fullWidth = false,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(7)}`;
    const { getSize } = useComponentConfig('textarea');
    const sizeConfig = getSize('md');
    
    const paddingX = sizeConfig?.paddingX || '0.75rem';
    const paddingY = sizeConfig?.paddingY || '0.5rem';
    const fontSize = sizeConfig?.fontSize || '0.875rem';
    const borderRadius = sizeConfig?.borderRadius || '0.375rem';

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-3 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <textarea
            ref={ref}
            id={textareaId}
            className={clsx(
              'block w-full',
              'bg-[var(--color-input)]',
              'text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted-foreground)]',
              'border-[var(--color-border)]',
              'shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'resize-y',
              error && 'border-error-500 dark:border-error-400 focus:border-error-500 dark:focus:border-error-400 focus:ring-error-500 dark:focus:ring-error-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            style={{
              paddingLeft: paddingX,
              paddingRight: paddingX,
              paddingTop: paddingY,
              paddingBottom: paddingY,
              fontSize,
              borderRadius,
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-3 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
