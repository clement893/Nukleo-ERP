/**
 * Widget Collections
 * 
 * Collections de widgets organisées par thème pour faciliter la navigation.
 * 
 * Les collections permettent de regrouper des widgets logiquement liés,
 * facilitant leur découverte et leur ajout au dashboard depuis l'interface utilisateur.
 * 
 * Chaque collection est associée à un module et peut contenir plusieurs widgets.
 * Les collections sont utilisées dans la WidgetLibrary pour organiser l'affichage
 * des widgets disponibles.
 * 
 * @module widgetCollections
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
      'opportunities-timeline',
      'opportunities-by-source',
      'clients-by-type',
      'win-rate-trend',
      'revenue-forecast',
      'average-deal-size',
      'sales-velocity',
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
      'projects-progress-chart',
      'projects-by-status-bar',
      'workload-by-project',
      'tasks-by-priority',
      'project-health-score',
      'resource-allocation',
      'milestones-timeline',
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
      'profit-margin-chart',
      'revenue-by-source',
      'invoices-status',
      'financial-forecast',
      'aging-receivables',
      'break-even-analysis',
      'financial-ratios',
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
      'productivity-trend',
      'employees-by-role',
      'workload-balance',
      'performance-reviews',
      'attendance-tracking',
      'skills-matrix',
      'training-completion',
      'employee-satisfaction',
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
      'dashboard-scorecard',
      'trend-analysis',
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
 * 
 * Les collections sont filtrées par module si spécifié, puis par permissions si fourni,
 * et enfin triées par module selon un ordre prédéfini pour une meilleure organisation.
 * 
 * @param module - Le module pour lequel filtrer les collections ('commercial', 'projects', etc.) ou 'all' pour toutes (défaut: undefined = toutes)
 * @param hasModuleAccess - Fonction optionnelle pour vérifier les permissions d'accès à un module
 * @returns Un tableau de collections filtrées et triées par module
 * 
 * @example
 * ```ts
 * // Récupérer toutes les collections
 * const allCollections = getAvailableCollections();
 * 
 * // Récupérer les collections du module commercial
 * const commercialCollections = getAvailableCollections('commercial');
 * 
 * // Récupérer avec vérification des permissions
 * const collections = getAvailableCollections('projects', (mod) => userHasAccess(mod));
 * ```
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
 * 
 * Retourne un objet où chaque clé est un module et chaque valeur est un tableau
 * de collections associées à ce module. Utile pour l'affichage organisé par onglets
 * ou sections dans l'interface utilisateur.
 * 
 * @param module - Le module pour lequel filtrer les collections ou 'all' pour toutes (défaut: undefined = toutes)
 * @param hasModuleAccess - Fonction optionnelle pour vérifier les permissions d'accès à un module
 * @returns Un objet Record où chaque clé est un DashboardModule et chaque valeur est un tableau de WidgetCollection
 * 
 * @example
 * ```ts
 * const collectionsByModule = getCollectionsByModule();
 * // {
 * //   commercial: [...],
 * //   projects: [...],
 * //   finances: [...],
 * //   ...
 * // }
 * ```
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
 * 
 * Récupère tous les widgets appartenant à une collection donnée en utilisant
 * leur ID de type. Retourne un objet Record où chaque clé est un WidgetType
 * et chaque valeur est la définition correspondante du widget.
 * 
 * @param collectionId - L'ID de la collection (ex: 'commercial-opportunities', 'projects-analytics')
 * @returns Un objet Record contenant les définitions de widgets de la collection, ou un objet vide si la collection n'existe pas
 * 
 * @example
 * ```ts
 * const widgets = getWidgetsByCollection('commercial-opportunities');
 * // Retourne les widgets: opportunities-list, opportunities-pipeline, opportunities-needing-action
 * ```
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
