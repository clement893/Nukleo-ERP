/**
 * usePrefetchRoutes Hook
 * 
 * Prefetches frequently visited routes after initial load
 * for faster subsequent navigation.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

// Routes fréquemment visitées à précharger
const FREQUENT_ROUTES = [
  '/dashboard',
  '/dashboard/projets',
  '/dashboard/projets/equipes',
  '/dashboard/leo',
  '/dashboard/commercial',
  '/dashboard/commercial/opportunites',
];

export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch les routes fréquentes après un délai d'inactivité
    // pour ne pas impacter le chargement initial
    const timer = setTimeout(() => {
      FREQUENT_ROUTES.forEach(route => {
        try {
          router.prefetch(route);
        } catch (error) {
          // Silently fail - prefetching is an optimization, not critical
          if (process.env.NODE_ENV === 'development') {
            console.debug('Failed to prefetch route:', route, error);
          }
        }
      });
    }, 2000); // Après 2 secondes d'inactivité

    return () => clearTimeout(timer);
  }, [router]);
}
