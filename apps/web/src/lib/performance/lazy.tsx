/**
 * Lazy Loading Utilities
 * Optimize component loading with dynamic imports
 */

import { ComponentType, lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <Spinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load a component with custom loading component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent?: ComponentType
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    const fallback = LoadingComponent ? <LoadingComponent /> : <Spinner />;
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

