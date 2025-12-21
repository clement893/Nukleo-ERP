import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ColorVariant, BaseComponentProps, ColorVariantProps, TitleProps, ClosableProps, IconProps, colorVariantMap } from './types';

interface AlertProps extends BaseComponentProps, ColorVariantProps, TitleProps, ClosableProps, IconProps {
  children: ReactNode;
  variant?: ColorVariant;
}

export default function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className,
  icon,
}: AlertProps) {
  const styles = colorVariantMap[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        styles.bg,
        styles.darkBg,
        styles.border,
        styles.darkBorder,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        {icon && (
          <div className={clsx('flex-shrink-0 mr-3', styles.text, styles.darkText)}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h3 className={clsx('font-semibold mb-1', styles.text, styles.darkText)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', styles.text, styles.darkText)}>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={clsx(
              'ml-4 flex-shrink-0',
              'hover:opacity-75 transition-opacity',
              styles.text,
              styles.darkText
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

