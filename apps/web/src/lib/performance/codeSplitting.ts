/**
 * Code Splitting Utilities
 * Provides utilities for dynamic imports and lazy loading
 */

import { ComponentType, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || (() => <div>Loading...</div>),
    ssr: options?.ssr !== false,
  });
}

/**
 * Lazy load a component with Suspense boundary
 */
export function withSuspense<T extends ComponentType<any>>(
  Component: T,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: any) {
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
export function routeSplit<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  routeName: string
) {
  return dynamic(importFn, {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    ),
    ssr: true,
  });
}

/**
 * Preload a component for faster subsequent loads
 */
export function preloadComponent(importFn: () => Promise<any>) {
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

