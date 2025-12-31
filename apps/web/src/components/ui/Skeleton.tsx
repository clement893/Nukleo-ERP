/**
 * Skeleton Component
 * 
 * Modern skeleton loader for better perceived performance.
 * Uses glassmorphism and shimmer animation.
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Skeleton variants for common use cases
 */

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-4/5' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" height={20} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            height={Math.random() * 150 + 50}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={40} height={12} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonWidget({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      {/* Content */}
      <div className="space-y-3">
        <Skeleton variant="text" width="60%" height={32} />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
