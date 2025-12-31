/**
 * Employee Portal Navigation Component
 * 
 * Navigation sidebar for the employee portal.
 * Displays navigation items for employee-specific sections.
 * 
 * @module EmployeePortalNavigation
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  CheckSquare,
  FolderKanban,
  Clock,
  Bot,
  Calendar,
  Receipt,
  User,
  Plane,
  LayoutDashboard,
} from 'lucide-react';

interface EmployeePortalNavigationProps {
  employeeId: number;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'tasks',
    label: 'Mes tâches',
    path: 'taches',
    icon: CheckSquare,
  },
  {
    id: 'projects',
    label: 'Mes projets',
    path: 'projets',
    icon: FolderKanban,
  },
  {
    id: 'timesheets',
    label: 'Mes feuilles de temps',
    path: 'feuilles-de-temps',
    icon: Clock,
  },
  {
    id: 'leo',
    label: 'Mon Leo',
    path: 'leo',
    icon: Bot,
  },
  {
    id: 'deadlines',
    label: 'Mes deadlines',
    path: 'deadlines',
    icon: Calendar,
  },
  {
    id: 'expenses',
    label: 'Mes comptes de dépenses',
    path: 'depenses',
    icon: Receipt,
  },
  {
    id: 'vacations',
    label: 'Mes vacances',
    path: 'vacances',
    icon: Plane,
  },
  {
    id: 'profile',
    label: 'Mon profil',
    path: 'profil',
    icon: User,
  },
];

export function EmployeePortalNavigation({ employeeId, className }: EmployeePortalNavigationProps) {
  const pathname = usePathname();
  
  // Extract current section from pathname
  const getCurrentSection = () => {
    // Match /portail-employe/[id]/[section] or /portail-employe/[id] (dashboard)
    const match = pathname.match(/\/portail-employe\/\d+\/(.+)$/);
    if (!match) {
      // Check if it's exactly /portail-employe/[id] or /portail-employe/[id]/dashboard
      const exactMatch = pathname.match(/\/portail-employe\/\d+(\/dashboard)?\/?$/);
      return exactMatch ? 'dashboard' : '';
    }
    return match[1];
  };

  const currentSection = getCurrentSection();

  const isActive = (itemPath: string) => {
    if (itemPath === 'dashboard') {
      return currentSection === 'dashboard' || currentSection === '';
    }
    return currentSection === itemPath;
  };

  return (
    <nav className={clsx('space-y-1', className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        const href = `/portail-employe/${employeeId}${item.path === 'dashboard' ? '/dashboard' : `/${item.path}`}`;

        return (
          <Link
            key={item.id}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
