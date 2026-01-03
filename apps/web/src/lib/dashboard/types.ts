/**
 * Types pour le système de dashboard personnalisable
 */

import type { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Modules disponibles dans l'application
 */
export type DashboardModule = 
  | 'commercial'
  | 'projects' 
  | 'finances'
  | 'team'
  | 'system'
  | 'reseau'
  | 'management'
  | 'global'; // Pour les widgets accessibles partout

/**
 * Catégories de widgets disponibles
 */
export type WidgetCategory = 
  | 'commercial' 
  | 'projects' 
  | 'finances' 
  | 'performance' 
  | 'team' 
  | 'system';

/**
 * Types de widgets disponibles
 */
export type WidgetType =
  // Commercial
  | 'opportunities-list'
  | 'opportunities-pipeline'
  | 'opportunities-needing-action'
  | 'clients-count'
  | 'clients-growth'
  | 'testimonials-carousel'
  | 'quotes-list'
  | 'submissions-list'
  | 'commercial-stats'
  | 'quotes-status-pie'
  | 'revenue-commercial-chart'
  | 'conversion-funnel-chart'
  | 'opportunities-timeline'
  | 'opportunities-by-source'
  | 'clients-by-type'
  | 'win-rate-trend'
  | 'revenue-forecast'
  | 'average-deal-size'
  | 'sales-velocity'
  // Projects
  | 'projects-active'
  | 'projects-status'
  | 'tasks-kanban'
  | 'tasks-list'
  | 'budget-vs-actual'
  | 'projects-timeline'
  | 'tasks-completion-trend'
  | 'projects-progress-chart'
  | 'projects-by-status-bar'
  | 'workload-by-project'
  | 'tasks-by-priority'
  | 'project-health-score'
  | 'resource-allocation'
  | 'milestones-timeline'
  // Finances
  | 'revenue-chart'
  | 'expenses-chart'
  | 'cash-flow'
  | 'revenue-vs-expenses'
  | 'expenses-by-category'
  | 'cash-flow-forecast'
  | 'profit-margin-chart'
  | 'revenue-by-source'
  | 'invoices-status'
  | 'financial-forecast'
  | 'aging-receivables'
  | 'break-even-analysis'
  | 'financial-ratios'
  // Performance
  | 'kpi-custom'
  | 'goals-progress'
  | 'growth-chart'
  // Team
  | 'employees-count'
  | 'workload-chart'
  | 'team-growth-timeline'
  | 'employees-by-department'
  | 'productivity-trend'
  | 'employees-by-role'
  | 'workload-balance'
  | 'performance-reviews'
  | 'attendance-tracking'
  | 'skills-matrix'
  | 'training-completion'
  | 'employee-satisfaction'
  // Performance / Global
  | 'dashboard-scorecard'
  | 'trend-analysis'
  // System
  | 'user-profile'
  | 'notifications'
  // Custom
  | 'custom';

/**
 * Périodes temporelles disponibles
 */
export type TimePeriod = 
  | 'day' 
  | 'week' 
  | 'month' 
  | 'quarter' 
  | 'year' 
  | 'custom';

/**
 * Tailles de widgets
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Configuration d'un widget
 */
export interface WidgetConfig {
  title?: string;
  period?: TimePeriod;
  custom_period?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  refresh_interval?: number; // en secondes
  kpi_name?: string; // Nom du KPI pour les widgets KPI personnalisés
  target?: number; // Cible pour les widgets KPI
  widget_id?: number; // ID du widget personnalisé (pour les widgets de type 'custom')
  style?: {
    color?: string;
    icon?: string;
    border?: boolean;
  };
}

/**
 * Layout d'un widget dans la grille
 */
export interface WidgetLayout {
  id: string;
  widget_type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  config: WidgetConfig;
}

/**
 * Configuration complète d'un dashboard
 */
export interface DashboardConfig {
  id: string;
  user_id?: number;
  name: string;
  is_default: boolean;
  layouts: WidgetLayout[];
  global_filters?: GlobalFilters;
  created_at?: string;
  updated_at?: string;
}

/**
 * Filtres globaux du dashboard
 */
export interface GlobalFilters {
  period?: {
    start: string;
    end: string;
  };
  start_date?: string; // Date de début (format ISO)
  end_date?: string; // Date de fin (format ISO)
  clients?: number[];
  projects?: number[];
  employees?: number[];
  company_id?: number; // ID d'une entreprise spécifique
  employee_id?: number; // ID d'un employé spécifique
  project_id?: number; // ID d'un projet spécifique
  statuses?: string[];
  tags?: string[];
}

/**
 * Définition d'un widget dans le registre
 */
export interface WidgetDefinition {
  id: WidgetType;
  name: string;
  description: string;
  category: WidgetCategory;
  modules: DashboardModule[]; // Liste des modules où le widget est disponible
  icon: LucideIcon;
  component: ComponentType<WidgetProps>;
  default_size: {
    w: number;
    h: number;
  };
  min_size: {
    w: number;
    h: number;
  };
  max_size?: {
    w: number;
    h: number;
  };
  configurable: boolean;
  config_schema?: any; // JSON Schema
  is_global?: boolean; // true pour widgets graphiques génériques accessibles partout
}

/**
 * Props communes à tous les widgets
 */
export interface WidgetProps {
  id: string;
  config: WidgetConfig;
  globalFilters?: GlobalFilters;
  onConfigChange?: (config: WidgetConfig) => void;
  onRemove?: () => void;
  onRefresh?: () => void;
}

/**
 * État de chargement d'un widget
 */
export interface WidgetLoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

/**
 * Données d'un widget
 */
export interface WidgetData<T = any> {
  data: T;
  loading: WidgetLoadingState;
}

/**
 * Layout prédéfini
 */
export interface PresetLayout {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  layouts: Omit<WidgetLayout, 'id'>[];
}
