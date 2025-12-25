/**
 * Resource Hints Component
 * Adds resource hints to the document head for better performance
 */

'use client';

import { useEffect } from 'react';
import { initializePreloading } from './preloading';

export function ResourceHints() {
  useEffect(() => {
    try {
      // Initialize preloading for critical resources
      initializePreloading();

      // Preload critical routes on hover
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach((link) => {
        link.addEventListener('mouseenter', () => {
          const href = link.getAttribute('href');
          if (href) {
            import('next/navigation')
              .then(({ useRouter }) => {
                // Prefetch route on hover
                const router = useRouter();
                router.prefetch(href);
              })
              .catch((error) => {
                // Silently fail prefetching - it's a performance optimization
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to prefetch route:', href, error);
                }
              });
          }
        });
      });

      return () => {
        // Cleanup if needed
      };
    } catch (error) {
      // Silently fail - resource hints are performance optimizations, not critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to initialize resource hints:', error);
      }
    }
  }, []);

  return null; // This component doesn't render anything
}

