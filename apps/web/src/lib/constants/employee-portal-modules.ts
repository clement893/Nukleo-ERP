/**
 * Employee Portal Modules Configuration
 * 
 * Defines the ERP modules that can be enabled for employees in their portal.
 * Each module corresponds to a section in the main ERP navigation.
 */

export interface EmployeePortalModule {
  id: string;
  label: string;
  description: string;
  icon: string;
  basePath: string;
  subPages?: Array<{
    name: string;
    path: string;
  }>;
}

/**
 * Available ERP modules for employee portal
 */
export const EMPLOYEE_PORTAL_MODULES: EmployeePortalModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Tableau de bord principal',
    icon: 'LayoutDashboard',
    basePath: '/dashboard',
  },
  {
    id: 'leo',
    label: 'Leo',
    description: 'Assistant IA',
    icon: 'Sparkles',
    basePath: '/dashboard/leo',
  },
  {
    id: 'ai',
    label: 'AI',
    description: 'Outils d\'intelligence artificielle',
    icon: 'Bot',
    basePath: '/dashboard/ai',
  },
  {
    id: 'commercial',
    label: 'Module Commercial',
    description: 'Gestion commerciale et opportunités',
    icon: 'Briefcase',
    basePath: '/dashboard/commercial',
    subPages: [
      { name: 'Accueil', path: '/dashboard/commercial' },
      { name: 'Opportunités', path: '/dashboard/commercial/opportunites' },
      { name: 'Pipeline & client', path: '/dashboard/commercial/pipeline-client' },
      { name: 'Soumissions', path: '/dashboard/commercial/soumissions' },
    ],
  },
  {
    id: 'reseau',
    label: 'Module Réseau',
    description: 'Gestion des contacts et entreprises',
    icon: 'Users',
    basePath: '/dashboard/reseau',
    subPages: [
      { name: 'Aperçu', path: '/dashboard/reseau' },
      { name: 'Contacts', path: '/dashboard/reseau/contacts' },
      { name: 'Entreprises', path: '/dashboard/reseau/entreprises' },
      { name: 'Témoignages', path: '/dashboard/reseau/temoignages' },
    ],
  },
  {
    id: 'operations',
    label: 'Modules Opérations',
    description: 'Gestion des projets et opérations',
    icon: 'FolderOpen',
    basePath: '/dashboard/projets',
    subPages: [
      { name: 'Accueil', path: '/dashboard/projets' },
      { name: 'Projets', path: '/dashboard/projets/projets' },
      { name: 'Clients', path: '/dashboard/projets/clients' },
      { name: 'Équipes', path: '/dashboard/projets/equipes' },
    ],
  },
  {
    id: 'management',
    label: 'Module Management',
    description: 'Gestion des employés et ressources humaines',
    icon: 'Briefcase',
    basePath: '/dashboard/management',
    subPages: [
      { name: 'Accueil', path: '/dashboard/management' },
      { name: 'Employés', path: '/dashboard/management/employes' },
      { name: 'Feuilles de temps', path: '/dashboard/management/feuilles-temps' },
      { name: 'Onboarding', path: '/dashboard/management/onboarding' },
      { name: 'Demandes de vacances', path: '/dashboard/management/vacances' },
      { name: 'Comptes de dépenses', path: '/dashboard/management/compte-depenses' },
    ],
  },
  {
    id: 'agenda',
    label: 'Module Agenda',
    description: 'Calendrier et gestion des événements',
    icon: 'CalendarDays',
    basePath: '/dashboard/agenda',
    subPages: [
      { name: 'Calendrier', path: '/dashboard/agenda/calendrier' },
      { name: 'Événements', path: '/dashboard/agenda/evenements' },
      { name: 'Deadlines', path: '/dashboard/agenda/deadlines' },
    ],
  },
  {
    id: 'finances',
    label: 'Module Finances',
    description: 'Gestion financière et facturation',
    icon: 'DollarSign',
    basePath: '/dashboard/finances',
    subPages: [
      { name: 'Accueil', path: '/dashboard/finances' },
      { name: 'Facturations', path: '/dashboard/finances/facturations' },
      { name: 'Rapport', path: '/dashboard/finances/rapport' },
      { name: 'Compte de dépenses', path: '/dashboard/finances/compte-depenses' },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestion',
    description: 'Gestion des utilisateurs et équipes',
    icon: 'Users',
    basePath: '/admin',
    subPages: [
      { name: 'Utilisateurs', path: '/admin/users' },
      { name: 'Équipes', path: '/admin/teams' },
    ],
  },
  {
    id: 'contenu',
    label: 'Contenu',
    description: 'Gestion du contenu et médias',
    icon: 'FolderKanban',
    basePath: '/admin',
    subPages: [
      { name: 'Pages', path: '/admin/pages' },
      { name: 'Articles', path: '/admin/articles' },
      { name: 'Médias', path: '/admin/media' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    description: 'Configuration et paramètres système',
    icon: 'Settings',
    basePath: '/settings',
    subPages: [
      { name: 'Profil', path: '/settings/profile' },
      { name: 'Sécurité', path: '/settings/security' },
    ],
  },
];
