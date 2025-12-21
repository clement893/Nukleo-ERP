'use client';

import { ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  icon?: ReactNode;
}

export default function Toast({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  icon,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-400',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-400',
    },
  };

  const styles = variants[type];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 shadow-lg min-w-[300px] max-w-md',
        'animate-slide-in-right',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start">
        {icon && (
          <div className={clsx('flex-shrink-0 mr-3', styles.icon)}>
            {icon}
          </div>
        )}
        <p className={clsx('flex-1 text-sm font-medium', styles.text)}>
          {message}
        </p>
        <button
          onClick={() => onClose(id)}
          className={clsx('ml-4 flex-shrink-0', styles.text)}
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

