/**
 * Resource Hints Component
 * Adds resource hints to the document head for better performance
 */

'use client';

import { useEffect } from 'react';
import { initializePreloading } from './preloading';

export function ResourceHints() {
  useEffect(() => {
    // Initialize preloading for critical resources
    initializePreloading();

    // Preload critical routes on hover
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (href) {
          import('next/navigation').then(({ useRouter }) => {
            // Prefetch route on hover
            const router = useRouter();
            router.prefetch(href);
          });
        }
      });
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null; // This component doesn't render anything
}

