'use client';

import { ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  icon?: ReactNode;
  title?: string;
}

export default function Toast({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  icon,
  title,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, duration, onClose]);

  // Default icons for each type
  const defaultIcons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const variants = {
    success: {
      icon: 'text-green-500',
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
    },
    error: {
      icon: 'text-red-500',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
    },
    warning: {
      icon: 'text-orange-500',
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
    },
    info: {
      icon: 'text-blue-500',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
    },
  };

  const styles = variants[type];
  const displayIcon = icon || defaultIcons[type];

  return (
    <div
      className={clsx(
        'glass-card rounded-xl border p-4 shadow-lg min-w-[320px] max-w-md',
        'animate-slide-in-right',
        styles.border,
        styles.bg
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={clsx('flex-shrink-0 mt-0.5', styles.icon)}>
          {displayIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-foreground mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-foreground/80">
            {message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => onClose(id)}
          className={clsx(
            'flex-shrink-0 p-1 rounded-lg transition-all duration-200',
            'hover:bg-foreground/10 text-foreground/60 hover:text-foreground'
          )}
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="mt-3 h-1 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              type === 'success' && 'bg-green-500',
              type === 'error' && 'bg-red-500',
              type === 'warning' && 'bg-orange-500',
              type === 'info' && 'bg-blue-500'
            )}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
