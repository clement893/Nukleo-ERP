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
 * Organisées par modules pour faciliter la navigation
 */
const widgetCollections: WidgetCollection[] = [
  // ========== MODULE COMMERCIAL ==========
  {
    id: 'commercial-opportunities',
    name: 'Opportunités Commerciales',
    description: 'Suivez et gérez vos opportunités commerciales avec des vues listes, pipeline et actions',
    module: 'commercial',
    color: 'blue',
    widgetTypes: [
      'opportunities-list',
      'opportunities-pipeline',
      'opportunities-needing-action',
    ],
  },
  {
    id: 'commercial-clients',
    name: 'Clients & Réseau',
    description: 'Analysez la croissance de votre réseau et les témoignages clients',
    module: 'commercial',
    color: 'purple',
    widgetTypes: [
      'clients-count',
      'clients-growth',
      'testimonials-carousel',
    ],
  },
  {
    id: 'commercial-quotes',
    name: 'Devis & Soumissions',
    description: 'Gérez vos devis et soumissions avec des widgets dédiés',
    module: 'commercial',
    color: 'indigo',
    widgetTypes: [
      'quotes-list',
      'submissions-list',
      'quotes-status-pie',
    ],
  },
  {
    id: 'commercial-analytics',
    name: 'Analytiques Commerciales',
    description: 'Graphiques et analyses des performances commerciales',
    module: 'commercial',
    color: 'blue',
    widgetTypes: [
      'revenue-commercial-chart',
      'conversion-funnel-chart',
    ],
  },
  {
    id: 'commercial-stats',
    name: 'Statistiques Commerciales',
    description: 'Vue d\'ensemble complète des performances commerciales',
    module: 'commercial',
    color: 'blue',
    widgetTypes: [
      'commercial-stats',
    ],
  },

  // ========== MODULE PROJETS ==========
  {
    id: 'projects-overview',
    name: 'Vue d\'ensemble Projets',
    description: 'Suivez l\'état et la progression de tous vos projets',
    module: 'projects',
    color: 'green',
    widgetTypes: [
      'projects-active',
      'projects-status',
    ],
  },
  {
    id: 'projects-tasks',
    name: 'Tâches & Kanban',
    description: 'Organisez et suivez vos tâches avec des vues kanban et listes',
    module: 'projects',
    color: 'teal',
    widgetTypes: [
      'tasks-kanban',
      'tasks-list',
      'tasks-completion-trend',
    ],
  },
  {
    id: 'projects-analytics',
    name: 'Analytiques Projets',
    description: 'Analyses approfondies des budgets, timelines et performance',
    module: 'projects',
    color: 'green',
    widgetTypes: [
      'budget-vs-actual',
      'projects-timeline',
    ],
  },

  // ========== MODULE FINANCES ==========
  {
    id: 'finances-overview',
    name: 'Vue d\'ensemble Finances',
    description: 'Analysez vos revenus, dépenses et trésorerie en temps réel',
    module: 'finances',
    color: 'emerald',
    widgetTypes: [
      'revenue-chart',
      'expenses-chart',
      'cash-flow',
      'revenue-vs-expenses',
      'expenses-by-category',
      'cash-flow-forecast',
    ],
  },

  // ========== MODULE ÉQUIPE ==========
  {
    id: 'team-overview',
    name: 'Vue d\'ensemble Équipe',
    description: 'Suivez votre équipe et la charge de travail de chacun',
    module: 'team',
    color: 'amber',
    widgetTypes: [
      'employees-count',
      'workload-chart',
      'team-growth-timeline',
      'employees-by-department',
    ],
  },

  // ========== MODULE GLOBAL / PERFORMANCE ==========
  {
    id: 'performance-kpis',
    name: 'KPIs & Performance',
    description: 'Créez et suivez vos indicateurs de performance personnalisés',
    module: 'global',
    color: 'orange',
    widgetTypes: [
      'kpi-custom',
      'goals-progress',
      'growth-chart',
    ],
  },

  // ========== MODULE SYSTÈME ==========
  {
    id: 'system-notifications',
    name: 'Notifications & Profil',
    description: 'Restez informé avec les notifications et gérez votre profil',
    module: 'system',
    color: 'gray',
    widgetTypes: [
      'notifications',
      'user-profile',
    ],
  },
];

/**
 * Obtenir les collections disponibles selon le module et les permissions
 * Les collections sont triées par module pour une meilleure organisation
 */
export function getAvailableCollections(
  module?: DashboardModule | 'all',
  hasModuleAccess?: (module: string) => boolean
): WidgetCollection[] {
  const filtered = widgetCollections.filter((collection) => {
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

  // Trier par module selon l'ordre défini
  const moduleOrder: DashboardModule[] = [
    'commercial',
    'projects',
    'finances',
    'team',
    'global',
    'system',
    'reseau',
    'management',
  ];

  return filtered.sort((a, b) => {
    const indexA = moduleOrder.indexOf(a.module);
    const indexB = moduleOrder.indexOf(b.module);
    // Si les deux modules sont dans l'ordre, trier par leur position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Si un seul est dans l'ordre, le mettre en premier
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Sinon, trier alphabétiquement
    return a.module.localeCompare(b.module);
  });
}

/**
 * Obtenir les collections groupées par module
 */
export function getCollectionsByModule(
  module?: DashboardModule | 'all',
  hasModuleAccess?: (module: string) => boolean
): Record<DashboardModule, WidgetCollection[]> {
  const collections = getAvailableCollections(module, hasModuleAccess);
  const grouped: Partial<Record<DashboardModule, WidgetCollection[]>> = {};

  collections.forEach((collection) => {
    if (!grouped[collection.module]) {
      grouped[collection.module] = [];
    }
    grouped[collection.module]!.push(collection);
  });

  return grouped as Record<DashboardModule, WidgetCollection[]>;
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
