/**
 * Registre des widgets disponibles pour le portail employé
 */

import {
  CheckSquare,
  Clock,
  Briefcase,
  Calendar,
  TrendingUp,
} from 'lucide-react';

import type { WidgetDefinition } from './types';

// Import des composants de widgets spécifiques employé
import { 
  EmployeeTasksWidget,
  EmployeeHoursWidget,
  EmployeeProjectsWidget,
  EmployeeVacationsWidget,
  TasksListWidget,
  KPICustomWidget,
} from '@/components/dashboard/widgets';

/**
 * Types de widgets spécifiques au portail employé
 * Note: Ces types doivent être compatibles avec WidgetType du système principal
 */
export type EmployeePortalWidgetType =
  | 'employee-tasks'
  | 'employee-hours'
  | 'employee-projects'
  | 'employee-vacations'
  | 'tasks-list'
  | 'kpi-custom';

/**
 * Registre de tous les widgets disponibles pour le portail employé
 */
export const employeePortalWidgetRegistry: Record<string, Omit<WidgetDefinition, 'id'> & { id: string }> = {
  'employee-tasks': {
    id: 'employee-tasks',
    name: 'Mes Tâches',
    description: 'Vue d\'ensemble de vos tâches avec statistiques',
    category: 'projects',
    icon: CheckSquare,
    component: EmployeeTasksWidget as any,
    default_size: { w: 4, h: 3 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 4 },
    configurable: true,
  },
  
  'employee-hours': {
    id: 'employee-hours',
    name: 'Mes Heures',
    description: 'Suivi des heures travaillées cette semaine et ce mois',
    category: 'performance',
    icon: Clock,
    component: EmployeeHoursWidget as any,
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 3 },
    configurable: true,
  },
  
  'employee-projects': {
    id: 'employee-projects',
    name: 'Mes Projets',
    description: 'Liste des projets auxquels vous êtes assigné',
    category: 'projects',
    icon: Briefcase,
    component: EmployeeProjectsWidget as any,
    default_size: { w: 3, h: 3 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 6, h: 4 },
    configurable: true,
  },
  
  'employee-vacations': {
    id: 'employee-vacations',
    name: 'Mes Vacances',
    description: 'Vos vacances à venir et demandes en attente',
    category: 'system',
    icon: Calendar,
    component: EmployeeVacationsWidget as any,
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 3 },
    configurable: true,
  },
  
  'tasks-list': {
    id: 'tasks-list',
    name: 'Liste des Tâches',
    description: 'Liste détaillée de toutes vos tâches',
    category: 'projects',
    icon: CheckSquare,
    component: TasksListWidget as any,
    default_size: { w: 4, h: 3 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 4 },
    configurable: true,
  },
  
  'kpi-custom': {
    id: 'kpi-custom',
    name: 'KPI Personnalisé',
    description: 'Indicateur de performance personnalisable',
    category: 'performance',
    icon: TrendingUp,
    component: KPICustomWidget as any,
    default_size: { w: 2, h: 1 },
    min_size: { w: 2, h: 1 },
    max_size: { w: 4, h: 2 },
    configurable: true,
  },
};

/**
 * Obtenir un widget par son type
 */
export function getEmployeePortalWidget(type: string): WidgetDefinition | undefined {
  return employeePortalWidgetRegistry[type] as WidgetDefinition | undefined;
}

/**
 * Obtenir tous les widgets d'une catégorie
 */
export function getEmployeePortalWidgetsByCategory(category: string): WidgetDefinition[] {
  return Object.values(employeePortalWidgetRegistry).filter(w => w.category === category) as WidgetDefinition[];
}

/**
 * Obtenir toutes les catégories disponibles
 */
export function getEmployeePortalCategories(): string[] {
  const categories = new Set(Object.values(employeePortalWidgetRegistry).map(w => w.category));
  return Array.from(categories);
}
