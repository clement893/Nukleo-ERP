/**
 * Hook spécialisé pour le dashboard commercial
 * Configure automatiquement le contexte 'commercial'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useCommercialDashboard = () => {
  const store = useDashboardStore();
  
  useEffect(() => {
    // Définir le contexte 'commercial' au montage
    if (store.context !== 'commercial') {
      store.setContext('commercial').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
