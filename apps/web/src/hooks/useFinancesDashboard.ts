/**
 * Hook spécialisé pour le dashboard finances
 * Configure automatiquement le contexte 'finances'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useFinancesDashboard = () => {
  const store = useDashboardStore('finances');
  
  useEffect(() => {
    // Définir le contexte 'finances' au montage
    if (store.context !== 'finances') {
      store.setContext('finances').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
