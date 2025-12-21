import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface AlertProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  onClose?: () => void;
  className?: string;
  icon?: ReactNode;
}

export default function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className,
  icon,
}: AlertProps) {
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      title: 'text-green-900',
      icon: 'text-green-400',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      title: 'text-red-900',
      icon: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      title: 'text-yellow-900',
      icon: 'text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      title: 'text-blue-900',
      icon: 'text-blue-400',
    },
  };

  const styles = variants[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        styles.bg,
        styles.border,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        {icon && (
          <div className={clsx('flex-shrink-0 mr-3', styles.icon)}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h3 className={clsx('font-semibold mb-1', styles.title)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', styles.text)}>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={clsx(
              'ml-4 flex-shrink-0',
              'hover:opacity-75 transition-opacity',
              styles.text
            )}
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
        )}
      </div>
    </div>
  );
}

