/**
 * Hook spécialisé pour le dashboard management
 * Configure automatiquement le contexte 'management'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useManagementDashboard = () => {
  const store = useDashboardStore('management');
  
  useEffect(() => {
    // Définir le contexte 'management' au montage
    if (store.context !== 'management') {
      store.setContext('management').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
