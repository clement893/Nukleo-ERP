/**
 * Navigation Structure
 * 
 * Centralized navigation configuration for the application sidebar.
 * Supports grouped navigation items with collapsible sections.
 */

import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Shield, 
  FolderKanban, 
  FileText, 
  Image, 
  Settings, 
  User, 
  Lock, 
  Sliders, 
  FileCheck, 
  Palette, 
  Cog,
  Briefcase,
  Building2,
  UserCircle,
  Target,
  TrendingUp,
  FolderOpen,
  Building,
  Clock,
  UserPlus,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarOff,
  CalendarClock,
  Sparkles,
  DollarSign,
  Receipt,
  FileBarChart,
  Wallet,
  MessageSquare
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface NavigationGroup {
  name: string;
  icon?: ReactNode;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface NavigationConfig {
  items: (NavigationItem | NavigationGroup)[];
}

/**
 * Get default navigation structure
 * Can be customized based on user permissions
 */
export function getNavigationConfig(isAdmin: boolean): NavigationConfig {
  const config: NavigationConfig = {
    items: [
      // Dashboard (non-grouped)
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      // Assistant AI Leo (non-grouped)
      {
        name: 'Leo',
        href: '/dashboard/leo',
        icon: <Sparkles className="w-5 h-5" />,
        badge: 'AI',
      },
      // Module Commercial (collapsible group)
      {
        name: 'Module Commercial',
        icon: <Briefcase className="w-5 h-5" />,
        items: [
          {
            name: 'Accueil',
            href: '/dashboard/commercial',
            icon: <Briefcase className="w-5 h-5" />,
          },
          {
            name: 'Contacts',
            href: '/dashboard/commercial/contacts',
            icon: <UserCircle className="w-5 h-5" />,
          },
          {
            name: 'Entreprises',
            href: '/dashboard/commercial/entreprises',
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            name: 'Opportunités',
            href: '/dashboard/commercial/opportunites',
            icon: <Target className="w-5 h-5" />,
          },
          {
            name: 'Pipeline & client',
            href: '/dashboard/commercial/pipeline-client',
            icon: <TrendingUp className="w-5 h-5" />,
          },
          {
            name: 'Témoignages',
            href: '/dashboard/commercial/temoignages',
            icon: <MessageSquare className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Modules Opérations (collapsible group)
      {
        name: 'Modules Opérations',
        icon: <FolderOpen className="w-5 h-5" />,
        items: [
          {
            name: 'Accueil',
            href: '/dashboard/projets',
            icon: <FolderOpen className="w-5 h-5" />,
          },
          {
            name: 'Projets',
            href: '/dashboard/projets/projets',
            icon: <FolderKanban className="w-5 h-5" />,
          },
          {
            name: 'Clients',
            href: '/dashboard/projets/clients',
            icon: <Building className="w-5 h-5" />,
          },
          {
            name: 'Équipes',
            href: '/dashboard/projets/equipes',
            icon: <Users className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Module Management (collapsible group)
      {
        name: 'Module Management',
        icon: <Briefcase className="w-5 h-5" />,
        items: [
          {
            name: 'Accueil',
            href: '/dashboard/management',
            icon: <Briefcase className="w-5 h-5" />,
          },
          {
            name: 'Employés',
            href: '/dashboard/management/employes',
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: 'Feuilles de temps',
            href: '/dashboard/management/feuilles-temps',
            icon: <Clock className="w-5 h-5" />,
          },
          {
            name: 'Onboarding',
            href: '/dashboard/management/onboarding',
            icon: <UserPlus className="w-5 h-5" />,
          },
          {
            name: 'Vacances',
            href: '/dashboard/management/vacances',
            icon: <Calendar className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Module Agenda (collapsible group)
      {
        name: 'Module Agenda',
        icon: <CalendarDays className="w-5 h-5" />,
        items: [
          {
            name: 'Calendrier',
            href: '/dashboard/agenda/calendrier',
            icon: <Calendar className="w-5 h-5" />,
          },
          {
            name: 'Événements',
            href: '/dashboard/agenda/evenements',
            icon: <CalendarCheck className="w-5 h-5" />,
          },
          {
            name: 'Absences/Vacances',
            href: '/dashboard/agenda/absences-vacances',
            icon: <CalendarOff className="w-5 h-5" />,
          },
          {
            name: 'Deadlines',
            href: '/dashboard/agenda/deadlines',
            icon: <CalendarClock className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Module Finances (collapsible group)
      {
        name: 'Module Finances',
        icon: <DollarSign className="w-5 h-5" />,
        items: [
          {
            name: 'Accueil',
            href: '/dashboard/finances',
            icon: <DollarSign className="w-5 h-5" />,
          },
          {
            name: 'Facturations',
            href: '/dashboard/finances/facturations',
            icon: <Receipt className="w-5 h-5" />,
          },
          {
            name: 'Rapport',
            href: '/dashboard/finances/rapport',
            icon: <FileBarChart className="w-5 h-5" />,
          },
          {
            name: 'Compte de dépenses',
            href: '/dashboard/finances/compte-depenses',
            icon: <Wallet className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Gestion (collapsible group)
      {
        name: 'Gestion',
        icon: <Users className="w-5 h-5" />,
        items: [
          {
            name: 'Utilisateurs',
            href: '/admin/users',
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: 'Équipes',
            href: '/admin/teams',
            icon: <UserCog className="w-5 h-5" />,
          },
          {
            name: 'Rôles',
            href: '/admin/roles',
            icon: <Shield className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Contenu (collapsible group)
      {
        name: 'Contenu',
        icon: <FolderKanban className="w-5 h-5" />,
        items: [
          {
            name: 'Pages',
            href: '/admin/pages',
            icon: <FileText className="w-5 h-5" />,
          },
          {
            name: 'Articles',
            href: '/admin/articles',
            icon: <FileCheck className="w-5 h-5" />,
          },
          {
            name: 'Médias',
            href: '/admin/media',
            icon: <Image className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Paramètres (collapsible group)
      {
        name: 'Paramètres',
        icon: <Settings className="w-5 h-5" />,
        items: [
          {
            name: 'Profil',
            href: '/settings/profile',
            icon: <User className="w-5 h-5" />,
          },
          {
            name: 'Sécurité',
            href: '/settings/security',
            icon: <Lock className="w-5 h-5" />,
          },
          {
            name: 'Préférences',
            href: '/settings/preferences',
            icon: <Sliders className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
    ],
  };

  // Add Admin group only for admins
  if (isAdmin) {
    config.items.push({
      name: 'Admin',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          name: 'Logs',
          href: '/admin/testing',
          icon: <FileText className="w-5 h-5" />,
        },
        {
          name: 'Thèmes',
          href: '/admin/themes',
          icon: <Palette className="w-5 h-5" />,
        },
        {
          name: 'Configuration',
          href: '/admin/settings',
          icon: <Cog className="w-5 h-5" />,
        },
      ],
      collapsible: true,
      defaultOpen: false,
    });
  }

  return config;
}
