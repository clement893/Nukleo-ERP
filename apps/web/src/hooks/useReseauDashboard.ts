/**
 * Hook spécialisé pour le dashboard réseau
 * Configure automatiquement le contexte 'reseau'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useReseauDashboard = () => {
  const store = useDashboardStore('reseau');
  
  useEffect(() => {
    // Définir le contexte 'reseau' au montage
    if (store.context !== 'reseau') {
      store.setContext('reseau').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
