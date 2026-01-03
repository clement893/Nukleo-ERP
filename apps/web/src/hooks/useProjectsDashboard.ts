/**
 * Hook spécialisé pour le dashboard projets
 * Configure automatiquement le contexte 'projects'
 */

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard/store';

export const useProjectsDashboard = () => {
  const store = useDashboardStore('projects');
  
  useEffect(() => {
    // Définir le contexte 'projects' au montage
    if (store.context !== 'projects') {
      store.setContext('projects').catch(console.error);
    }
  }, []); // Seulement au montage
  
  return store;
};
