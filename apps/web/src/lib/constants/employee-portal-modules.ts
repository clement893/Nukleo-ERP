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
 * Transforme un chemin de module en chemin pour le portail employé
 * Convertit les chemins /dashboard/* en /portail-employe/[id]/modules/*
 */
export function getEmployeePortalModulePath(
  employeeId: number,
  modulePath: string,
  locale: string = 'fr'
): string {
  // Si le chemin commence par /dashboard, le transformer en /portail-employe/[id]/modules
  if (modulePath.startsWith('/dashboard')) {
    const pathWithoutDashboard = modulePath.replace('/dashboard', '');
    // Si c'est juste /dashboard, rediriger vers le dashboard du portail
    if (pathWithoutDashboard === '' || pathWithoutDashboard === '/') {
      return `/${locale}/portail-employe/${employeeId}/dashboard`;
    }
    return `/${locale}/portail-employe/${employeeId}/modules${pathWithoutDashboard}`;
  }
  
  // Si le chemin commence par /admin, le transformer en /portail-employe/[id]/admin
  if (modulePath.startsWith('/admin')) {
    const pathWithoutAdmin = modulePath.replace('/admin', '');
    return `/${locale}/portail-employe/${employeeId}/admin${pathWithoutAdmin}`;
  }
  
  // Si le chemin commence par /settings, le transformer en /portail-employe/[id]/settings
  if (modulePath.startsWith('/settings')) {
    const pathWithoutSettings = modulePath.replace('/settings', '');
    return `/${locale}/portail-employe/${employeeId}/settings${pathWithoutSettings}`;
  }
  
  // Pour les autres chemins, ajouter le préfixe portail-employe
  return `/${locale}/portail-employe/${employeeId}${modulePath}`;
}

/**
 * Configuration des modules avec transformation dynamique pour le portail employé
 */
export function getEmployeePortalModules(employeeId: number, locale: string = 'fr'): EmployeePortalModule[] {
  return EMPLOYEE_PORTAL_MODULES.map(module => ({
    ...module,
    basePath: getEmployeePortalModulePath(employeeId, module.basePath, locale),
    subPages: module.subPages?.map(subPage => ({
      ...subPage,
      path: getEmployeePortalModulePath(employeeId, subPage.path, locale),
    })),
  }));
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
