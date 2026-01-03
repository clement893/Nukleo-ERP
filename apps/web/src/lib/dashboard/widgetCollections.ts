/**
 * Widget Collections
 * 
 * Collections de widgets organisées par thème pour faciliter la navigation
 */

import type { DashboardModule, WidgetType } from './types';
import { widgetRegistry } from './widgetRegistry';

export interface WidgetCollection {
  id: string;
  name: string;
  description: string;
  module: DashboardModule;
  color: 'blue' | 'purple' | 'green' | 'indigo' | 'orange' | 'amber' | 'teal' | 'emerald' | 'gray';
  widgetTypes: WidgetType[];
}

export const moduleLabels: Record<DashboardModule, string> = {
  commercial: 'Commercial',
  projects: 'Projets',
  finances: 'Finances',
  team: 'Équipe',
  system: 'Système',
  reseau: 'Réseau',
  management: 'Management',
  global: 'Global',
};

/**
 * Collections de widgets disponibles
 */
const widgetCollections: WidgetCollection[] = [
  {
    id: 'commercial-opportunities',
    name: 'Opportunités Commerciales',
    description: 'Widgets pour suivre et gérer les opportunités commerciales',
    module: 'commercial',
    color: 'blue',
    widgetTypes: ['opportunities-list', 'opportunities-pipeline', 'opportunities-needing-action'],
  },
  {
    id: 'commercial-clients',
    name: 'Clients & Réseau',
    description: 'Widgets pour suivre les clients et la croissance du réseau',
    module: 'commercial',
    color: 'purple',
    widgetTypes: ['clients-count', 'clients-growth', 'testimonials-carousel'],
  },
  {
    id: 'commercial-quotes',
    name: 'Devis & Soumissions',
    description: 'Widgets pour gérer les devis et soumissions',
    module: 'commercial',
    color: 'indigo',
    widgetTypes: ['quotes-list', 'submissions-list'],
  },
  {
    id: 'projects-overview',
    name: 'Vue d\'ensemble Projets',
    description: 'Widgets pour suivre l\'état des projets',
    module: 'projects',
    color: 'green',
    widgetTypes: ['projects-active', 'projects-status'],
  },
  {
    id: 'projects-tasks',
    name: 'Tâches & Kanban',
    description: 'Widgets pour gérer les tâches et le workflow',
    module: 'projects',
    color: 'teal',
    widgetTypes: ['tasks-kanban', 'tasks-list'],
  },
  {
    id: 'finances-overview',
    name: 'Vue d\'ensemble Finances',
    description: 'Widgets pour suivre les revenus, dépenses et flux de trésorerie',
    module: 'finances',
    color: 'emerald',
    widgetTypes: ['revenue-chart', 'expenses-chart', 'cash-flow'],
  },
  {
    id: 'performance-kpis',
    name: 'KPIs & Performance',
    description: 'Widgets pour suivre les indicateurs de performance',
    module: 'global',
    color: 'orange',
    widgetTypes: ['kpi-custom', 'goals-progress', 'growth-chart', 'commercial-stats'],
  },
  {
    id: 'team-overview',
    name: 'Vue d\'ensemble Équipe',
    description: 'Widgets pour suivre l\'équipe et la charge de travail',
    module: 'team',
    color: 'amber',
    widgetTypes: ['employees-count', 'workload-chart'],
  },
  {
    id: 'system-notifications',
    name: 'Notifications & Profil',
    description: 'Widgets système pour les notifications et le profil utilisateur',
    module: 'system',
    color: 'gray',
    widgetTypes: ['notifications', 'user-profile'],
  },
];

/**
 * Obtenir les collections disponibles selon le module et les permissions
 */
export function getAvailableCollections(
  module?: DashboardModule | 'all',
  hasModuleAccess?: (module: string) => boolean
): WidgetCollection[] {
  return widgetCollections.filter((collection) => {
    // Filtrer par module si spécifié
    if (module && module !== 'all' && collection.module !== module) {
      return false;
    }
    
    // Vérifier les permissions si fournies
    if (hasModuleAccess && !hasModuleAccess(collection.module)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Obtenir les widgets d'une collection spécifique
 */
export function getWidgetsByCollection(collectionId: string): Record<WidgetType, typeof widgetRegistry[WidgetType]> {
  const collection = widgetCollections.find((c) => c.id === collectionId);
  if (!collection) {
    return {} as Record<WidgetType, typeof widgetRegistry[WidgetType]>;
  }
  
  const widgets: Partial<Record<WidgetType, typeof widgetRegistry[WidgetType]>> = {};
  for (const widgetType of collection.widgetTypes) {
    if (widgetType in widgetRegistry) {
      widgets[widgetType] = widgetRegistry[widgetType];
    }
  }
  
  return widgets as Record<WidgetType, typeof widgetRegistry[WidgetType]>;
}
