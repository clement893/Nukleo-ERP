/**
 * Hook spécialisé pour le dashboard ERP
 * Configure automatiquement le contexte 'erp'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useERPDashboard = () => {
  const store = useDashboardStore();
  
  useEffect(() => {
    // Définir le contexte 'erp' au montage
    if (store.context !== 'erp') {
      store.setContext('erp').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
