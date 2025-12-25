/**
 * Code Splitting Utilities
 * Provides utilities for dynamic imports and lazy loading
 */

import { ComponentType, Suspense } from 'react';
import dynamic from 'next/dynamic';

type ComponentProps = Record<string, unknown>;

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<ComponentProps>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType<ComponentProps>;
    ssr?: boolean;
  }
) {
  const LoadingComponent = options?.loading || (() => <div>Loading...</div>);
  return dynamic(importFn, {
    loading: LoadingComponent as ComponentType<ComponentProps>,
    ssr: options?.ssr !== false,
  });
}

/**
 * Lazy load a component with Suspense boundary
 */
export function withSuspense<T extends ComponentType<ComponentProps>>(
  Component: T,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Route-based code splitting helper
 * Splits code by route for better performance
 */
export function routeSplit<T extends ComponentType<ComponentProps>>(
  importFn: () => Promise<{ default: T }>,
  routeName: string
) {
  const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  );
  return dynamic(importFn, {
    loading: LoadingComponent as ComponentType<ComponentProps>,
    ssr: true,
  });
}

/**
 * Preload a component for faster subsequent loads
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<ComponentProps> }>
) {
  if (typeof window !== 'undefined') {
    // Preload on next idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn();
      });
    } else {
      setTimeout(() => {
        importFn();
      }, 2000);
    }
  }
}

