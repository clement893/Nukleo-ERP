/**
 * Registre des widgets disponibles
 */

import {
  TrendingUp,
  Users,
  FolderKanban,
  DollarSign,
  Target,
  UserCircle,
  Bell,
  BarChart3,
  PieChart,
  LineChart,
  MessageSquare,
  CheckSquare,
  Briefcase,
  Puzzle,
  FileText,
  AlertCircle,
  LayoutDashboard,
  Filter,
} from 'lucide-react';

import type { WidgetDefinition, WidgetType, DashboardModule } from './types';

// Import des composants de widgets
import { 
  OpportunitiesListWidget, 
  OpportunitiesPipelineWidget,
  OpportunitiesNeedingActionWidget,
  ClientsCountWidget,
  ClientsGrowthWidget,
  TestimonialsCarouselWidget,
  QuotesWidget,
  SubmissionsWidget,
  CommercialStatsWidget,
  QuotesStatusPieWidget,
  RevenueCommercialChartWidget,
  ConversionFunnelChartWidget,
  ProjectsActiveWidget,
  ProjectsStatusWidget,
  TasksKanbanWidget,
  TasksListWidget,
  BudgetVsActualWidget,
  ProjectsTimelineWidget,
  TasksCompletionTrendWidget,
  RevenueChartWidget,
  ExpensesChartWidget,
  CashFlowWidget,
  RevenueVsExpensesWidget,
  ExpensesByCategoryWidget,
  CashFlowForecastWidget,
  KPICustomWidget,
  GoalsProgressWidget,
  GrowthChartWidget,
  EmployeesCountWidget,
  WorkloadChartWidget,
  TeamGrowthTimelineWidget,
  EmployeesByDepartmentWidget,
  UserProfileWidget,
  NotificationsWidget,
  CustomWidget,
} from "@/components/dashboard/widgets";


/**
 * Registre de tous les widgets disponibles
 */
export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  // ========== COMMERCIAL ==========
  'opportunities-list': {
    id: 'opportunities-list',
    name: 'Liste des Opportunités',
    description: 'Affiche la liste des opportunités récentes avec leurs détails',
    category: 'commercial',
    modules: ['commercial'],
    icon: TrendingUp,
    component: OpportunitiesListWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'opportunities-pipeline': {
    id: 'opportunities-pipeline',
    name: 'Pipeline des Opportunités',
    description: 'Vue kanban du pipeline commercial par étape',
    category: 'commercial',
    modules: ['commercial'],
    icon: BarChart3,
    component: OpportunitiesPipelineWidget,
    default_size: { w: 6, h: 3 },
    min_size: { w: 4, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'clients-count': {
    id: 'clients-count',
    name: 'Nombre de Clients',
    description: 'Compteur du nombre total de clients avec évolution',
    category: 'commercial',
    modules: ['commercial'],
    icon: Users,
    component: ClientsCountWidget,
    default_size: { w: 2, h: 1 },
    min_size: { w: 2, h: 1 },
    max_size: { w: 4, h: 2 },
    configurable: true,
  },
  
  'clients-growth': {
    id: 'clients-growth',
    name: 'Croissance Clients',
    description: 'Graphique d\'évolution du nombre de clients',
    category: 'commercial',
    modules: ['commercial'],
    icon: LineChart,
    component: ClientsGrowthWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'testimonials-carousel': {
    id: 'testimonials-carousel',
    name: 'Témoignages Clients',
    description: 'Carrousel des témoignages clients avec notes',
    category: 'commercial',
    modules: ['commercial'],
    icon: MessageSquare,
    component: TestimonialsCarouselWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 3 },
    configurable: true,
  },
  
  'opportunities-needing-action': {
    id: 'opportunities-needing-action',
    name: 'Opportunités nécessitant une action',
    description: 'Liste des opportunités nécessitant une soumission ou un suivi',
    category: 'commercial',
    modules: ['commercial'],
    icon: AlertCircle,
    component: OpportunitiesNeedingActionWidget,
    default_size: { w: 6, h: 3 },
    min_size: { w: 4, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'quotes-list': {
    id: 'quotes-list',
    name: 'Liste des Devis',
    description: 'Affiche la liste des devis récents avec leurs statuts',
    category: 'commercial',
    modules: ['commercial'],
    icon: FileText,
    component: QuotesWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'submissions-list': {
    id: 'submissions-list',
    name: 'Liste des Soumissions',
    description: 'Affiche la liste des soumissions récentes avec leurs statuts',
    category: 'commercial',
    modules: ['commercial'],
    icon: Briefcase,
    component: SubmissionsWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'commercial-stats': {
    id: 'commercial-stats',
    name: 'Statistiques Commerciales',
    description: 'Vue d\'ensemble des statistiques commerciales (opportunités, devis, soumissions)',
    category: 'commercial',
    modules: ['commercial'],
    icon: LayoutDashboard,
    component: CommercialStatsWidget,
    default_size: { w: 6, h: 2 },
    min_size: { w: 4, h: 2 },
    max_size: { w: 12, h: 3 },
    configurable: true,
  },
  
  'quotes-status-pie': {
    id: 'quotes-status-pie',
    name: 'Répartition Devis par Statut',
    description: 'Graphique circulaire montrant la répartition des devis par statut',
    category: 'commercial',
    modules: ['commercial'],
    icon: PieChart,
    component: QuotesStatusPieWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 3 },
    configurable: true,
  },
  
  'revenue-commercial-chart': {
    id: 'revenue-commercial-chart',
    name: 'Évolution Revenus Commerciaux',
    description: 'Graphique d\'évolution du chiffre d\'affaires commercial dans le temps',
    category: 'commercial',
    modules: ['commercial'],
    icon: LineChart,
    component: RevenueCommercialChartWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'conversion-funnel-chart': {
    id: 'conversion-funnel-chart',
    name: 'Entonnoir de Conversion',
    description: 'Visualisation du pipeline commercial avec taux de conversion par étape',
    category: 'commercial',
    modules: ['commercial'],
    icon: Filter,
    component: ConversionFunnelChartWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 3 },
    configurable: true,
  },
  
  // ========== PROJETS ==========
  'projects-active': {
    id: 'projects-active',
    name: 'Projets Actifs',
    description: 'Liste des projets en cours avec progression',
    category: 'projects',
    modules: ['projects'],
    icon: FolderKanban,
    component: ProjectsActiveWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'projects-status': {
    id: 'projects-status',
    name: 'Statuts des Projets',
    description: 'Répartition des projets par statut',
    category: 'projects',
    modules: ['projects'],
    icon: PieChart,
    component: ProjectsStatusWidget,
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 6, h: 3 },
    configurable: true,
  },
  
  'tasks-kanban': {
    id: 'tasks-kanban',
    name: 'Tâches Kanban',
    description: 'Vue kanban des tâches par statut',
    category: 'projects',
    modules: ['projects'],
    icon: CheckSquare,
    component: TasksKanbanWidget,
    default_size: { w: 6, h: 3 },
    min_size: { w: 4, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'tasks-list': {
    id: 'tasks-list',
    name: 'Liste des Tâches',
    description: 'Liste des tâches assignées avec priorités',
    category: 'projects',
    modules: ['projects'],
    icon: CheckSquare,
    component: TasksListWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'budget-vs-actual': {
    id: 'budget-vs-actual',
    name: 'Budget vs Réel',
    description: 'Comparaison entre budget alloué et dépenses réelles par projet',
    category: 'projects',
    modules: ['projects'],
    icon: DollarSign,
    component: BudgetVsActualWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'projects-timeline': {
    id: 'projects-timeline',
    name: 'Timeline des Projets',
    description: 'Évolution du nombre de projets par statut dans le temps',
    category: 'projects',
    modules: ['projects'],
    icon: FolderKanban,
    component: ProjectsTimelineWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'tasks-completion-trend': {
    id: 'tasks-completion-trend',
    name: 'Tendance Complétion Tâches',
    description: 'Évolution du nombre de tâches complétées et vélocité de l\'équipe',
    category: 'projects',
    modules: ['projects'],
    icon: CheckSquare,
    component: TasksCompletionTrendWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  // ========== FINANCES ==========
  'revenue-chart': {
    id: 'revenue-chart',
    name: 'Revenus',
    description: 'Graphique d\'évolution des revenus',
    category: 'finances',
    modules: ['finances', 'commercial'],
    icon: DollarSign,
    component: RevenueChartWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'expenses-chart': {
    id: 'expenses-chart',
    name: 'Dépenses',
    description: 'Graphique de répartition des dépenses',
    category: 'finances',
    modules: ['finances'],
    icon: DollarSign,
    component: ExpensesChartWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'cash-flow': {
    id: 'cash-flow',
    name: 'Trésorerie',
    description: 'Suivi de la trésorerie et prévisions',
    category: 'finances',
    modules: ['finances'],
    icon: DollarSign,
    component: CashFlowWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'revenue-vs-expenses': {
    id: 'revenue-vs-expenses',
    name: 'Revenus vs Dépenses',
    description: 'Comparaison des revenus et dépenses avec marge nette',
    category: 'finances',
    modules: ['finances'],
    icon: BarChart3,
    component: RevenueVsExpensesWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'expenses-by-category': {
    id: 'expenses-by-category',
    name: 'Dépenses par Catégorie',
    description: 'Répartition des dépenses par catégorie',
    category: 'finances',
    modules: ['finances'],
    icon: PieChart,
    component: ExpensesByCategoryWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 3 },
    configurable: true,
  },
  
  'cash-flow-forecast': {
    id: 'cash-flow-forecast',
    name: 'Prévision Trésorerie',
    description: 'Projection de trésorerie sur plusieurs mois avec identification des périodes de tension',
    category: 'finances',
    modules: ['finances'],
    icon: DollarSign,
    component: CashFlowForecastWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  // ========== PERFORMANCE ==========
  'kpi-custom': {
    id: 'kpi-custom',
    name: 'KPI Personnalisé',
    description: 'Indicateur de performance personnalisable',
    category: 'performance',
    modules: ['global'],
    icon: Target,
    component: KPICustomWidget,
    default_size: { w: 2, h: 1 },
    min_size: { w: 2, h: 1 },
    max_size: { w: 4, h: 2 },
    configurable: true,
    is_global: true,
  },
  
  'goals-progress': {
    id: 'goals-progress',
    name: 'Progression des Objectifs',
    description: 'Suivi de la progression vers les objectifs',
    category: 'performance',
    modules: ['global'],
    icon: Target,
    component: GoalsProgressWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
    is_global: true,
  },
  
  'growth-chart': {
    id: 'growth-chart',
    name: 'Croissance',
    description: 'Graphique de croissance globale',
    category: 'performance',
    modules: ['global'],
    icon: TrendingUp,
    component: GrowthChartWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
    is_global: true,
  },
  
  // ========== ÉQUIPE ==========
  'employees-count': {
    id: 'employees-count',
    name: 'Nombre d\'Employés',
    description: 'Compteur du nombre d\'employés actifs',
    category: 'team',
    modules: ['team'],
    icon: Users,
    component: EmployeesCountWidget,
    default_size: { w: 2, h: 1 },
    min_size: { w: 2, h: 1 },
    max_size: { w: 4, h: 2 },
    configurable: true,
  },
  
  'workload-chart': {
    id: 'workload-chart',
    name: 'Charge de Travail',
    description: 'Graphique de la charge de travail par employé',
    category: 'team',
    modules: ['team'],
    icon: Briefcase,
    component: WorkloadChartWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'team-growth-timeline': {
    id: 'team-growth-timeline',
    name: 'Évolution Effectif',
    description: 'Évolution du nombre d\'employés dans le temps avec recrutements et départs',
    category: 'team',
    modules: ['team'],
    icon: Users,
    component: TeamGrowthTimelineWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
  
  'employees-by-department': {
    id: 'employees-by-department',
    name: 'Répartition par Département',
    description: 'Répartition des employés par département',
    category: 'team',
    modules: ['team'],
    icon: Building2,
    component: EmployeesByDepartmentWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 3, h: 2 },
    max_size: { w: 6, h: 3 },
    configurable: true,
  },
  
  // ========== SYSTÈME ==========
  'user-profile': {
    id: 'user-profile',
    name: 'Profil Utilisateur',
    description: 'Informations du profil utilisateur',
    category: 'system',
    modules: ['system'],
    icon: UserCircle,
    component: UserProfileWidget,
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 3 },
    configurable: false,
  },
  
  'notifications': {
    id: 'notifications',
    name: 'Notifications',
    description: 'Liste des notifications récentes',
    category: 'system',
    modules: ['system'],
    icon: Bell,
    component: NotificationsWidget,
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 6, h: 4 },
    configurable: true,
    is_global: true,
  },
  
  // ========== CUSTOM ==========
  'custom': {
    id: 'custom',
    name: 'Widget Personnalisé',
    description: 'Widget personnalisé créé par l\'utilisateur',
    category: 'system',
    modules: ['global'],
    icon: Puzzle,
    component: CustomWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 12, h: 6 },
    configurable: true,
    is_global: true,
  },
};

/**
 * Obtenir un widget par son type
 */
export function getWidget(type: WidgetType): WidgetDefinition | undefined {
  return widgetRegistry[type];
}

/**
 * Obtenir tous les widgets d'une catégorie
 */
export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return Object.values(widgetRegistry).filter(w => w.category === category);
}

/**
 * Obtenir toutes les catégories disponibles
 */
export function getCategories(): string[] {
  const categories = new Set(Object.values(widgetRegistry).map(w => w.category));
  return Array.from(categories);
}

/**
 * Filtre les widgets par module
 */
export function getWidgetsByModule(
  module: DashboardModule | 'all',
  registry: Record<WidgetType, WidgetDefinition> = widgetRegistry
): Record<WidgetType, WidgetDefinition> {
  if (module === 'all') return registry;
  
  return Object.fromEntries(
    Object.entries(registry).filter(([_, widget]) => 
      widget.modules.includes(module) || 
      widget.modules.includes('global') ||
      widget.is_global === true
    )
  ) as Record<WidgetType, WidgetDefinition>;
}

/**
 * Obtient tous les widgets globaux (graphiques génériques)
 */
export function getGlobalWidgets(
  registry: Record<WidgetType, WidgetDefinition> = widgetRegistry
): Record<WidgetType, WidgetDefinition> {
  return Object.fromEntries(
    Object.entries(registry).filter(([_, widget]) => 
      widget.is_global === true || widget.modules.includes('global')
    )
  ) as Record<WidgetType, WidgetDefinition>;
}
