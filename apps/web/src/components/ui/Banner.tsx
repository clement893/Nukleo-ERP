'use client';

import { ReactNode, useState } from 'react';
import { clsx } from 'clsx';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from './Button';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  icon?: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<BannerVariant, { bg: string; border: string; text: string; icon: ReactNode }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: <Info className="w-5 h-5" />,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: <AlertCircle className="w-5 h-5" />,
  },
};

export default function Banner({
  variant = 'info',
  title,
  children,
  onClose,
  dismissible = false,
  icon,
  className,
  fullWidth = false,
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const styles = variantStyles[variant];
  const displayIcon = icon || styles.icon;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div
      className={clsx(
        'border rounded-lg p-4',
        styles.bg,
        styles.border,
        fullWidth ? 'w-full' : '',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={clsx('flex-shrink-0', styles.text)}>{displayIcon}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={clsx('font-semibold mb-1', styles.text)}>{title}</h3>
          )}
          <div className={clsx('text-sm', styles.text)}>{children}</div>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex-shrink-0 p-1"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

