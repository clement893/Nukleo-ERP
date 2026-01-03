/**
 * Hook spécialisé pour le dashboard principal
 * Configure automatiquement le contexte 'main'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useMainDashboard = () => {
  const store = useDashboardStore('main');
  
  useEffect(() => {
    // Définir le contexte 'main' au montage
    if (store.context !== 'main') {
      store.setContext('main').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
