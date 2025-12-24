'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status?: 'completed' | 'current' | 'pending';
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'default';
}

interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const statusIcons = {
  completed: CheckCircle2,
  current: Clock,
  pending: Circle,
};

const colorClasses = {
  primary: 'text-primary-600 dark:text-primary-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  default: 'text-gray-600 dark:text-gray-400',
};

export default function Timeline({ items, orientation = 'vertical', className }: TimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={clsx('flex items-start gap-4 overflow-x-auto pb-4', className)}>
        {items.map((item, index) => {
          const StatusIcon = statusIcons[item.status || 'pending'];
          const colorClass = colorClasses[item.color || 'default'];
          const isCompleted = item.status === 'completed';
          const isCurrent = item.status === 'current';

          return (
            <div key={item.id} className="flex flex-col items-center min-w-[120px]">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={clsx(
                      'h-0.5 flex-1',
                      isCompleted ? 'bg-primary-600 dark:bg-primary-400' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                )}
                <div
                  className={clsx(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2',
                    isCompleted
                      ? 'bg-primary-600 border-primary-600 dark:bg-primary-400 dark:border-primary-400'
                      : isCurrent
                      ? 'bg-white border-primary-600 dark:bg-gray-800 dark:border-primary-400'
                      : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600',
                    colorClass
                  )}
                >
                  {item.icon || <StatusIcon className="w-4 h-4" />}
                </div>
                {index < items.length - 1 && (
                  <div
                    className={clsx(
                      'h-0.5 flex-1',
                      isCompleted ? 'bg-primary-600 dark:bg-primary-400' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={clsx(
                    'text-sm font-medium',
                    isCurrent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{item.description}</div>
                )}
                {item.timestamp && (
                  <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">{item.timestamp}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      {items.map((item, index) => {
        const StatusIcon = statusIcons[item.status || 'pending'];
        const colorClass = colorClasses[item.color || 'default'];
        const isCompleted = item.status === 'completed';
        const isCurrent = item.status === 'current';
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Line */}
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            )}
            {!isLast && isCompleted && (
              <div className="absolute left-4 top-8 h-8 w-0.5 bg-primary-600 dark:bg-primary-400" />
            )}

            {/* Icon */}
            <div
              className={clsx(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0',
                isCompleted
                  ? 'bg-primary-600 border-primary-600 dark:bg-primary-400 dark:border-primary-400'
                  : isCurrent
                  ? 'bg-white border-primary-600 dark:bg-gray-800 dark:border-primary-400'
                  : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600',
                colorClass
              )}
            >
              {item.icon || <StatusIcon className="w-4 h-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div
                className={clsx(
                  'text-base font-medium',
                  isCurrent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {item.title}
              </div>
              {item.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</div>
              )}
              {item.timestamp && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{item.timestamp}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

