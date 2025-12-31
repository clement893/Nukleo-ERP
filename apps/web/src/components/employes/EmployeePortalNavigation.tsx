/**
 * Employee Portal Navigation Component
 * 
 * Navigation sidebar for the employee portal.
 * Displays navigation items for employee-specific sections.
 * Filters items based on employee portal permissions.
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
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { useState, useEffect } from 'react';

interface EmployeePortalNavigationProps {
  employeeId: number;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: string; // Module associé pour le filtrage par permissions
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: 'dashboard',
    icon: LayoutDashboard,
    module: 'crm', // Dashboard fait partie du module CRM
  },
  {
    id: 'tasks',
    label: 'Mes tâches',
    path: 'taches',
    icon: CheckSquare,
    module: 'tasks',
  },
  {
    id: 'projects',
    label: 'Mes projets',
    path: 'projets',
    icon: FolderKanban,
    module: 'crm',
  },
  {
    id: 'timesheets',
    label: 'Mes feuilles de temps',
    path: 'feuilles-de-temps',
    icon: Clock,
    module: 'timesheet',
  },
  {
    id: 'leo',
    label: 'Mon Leo',
    path: 'leo',
    icon: Bot,
    module: 'crm',
  },
  {
    id: 'deadlines',
    label: 'Mes deadlines',
    path: 'deadlines',
    icon: Calendar,
    module: 'tasks',
  },
  {
    id: 'expenses',
    label: 'Mes comptes de dépenses',
    path: 'depenses',
    icon: Receipt,
    module: 'accounting',
  },
  {
    id: 'vacations',
    label: 'Mes vacances',
    path: 'vacances',
    icon: Plane,
    module: 'crm',
  },
  {
    id: 'profile',
    label: 'Mon profil',
    path: 'profil',
    icon: User,
    module: 'settings',
  },
];

export function EmployeePortalNavigation({ employeeId, className }: EmployeePortalNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const { hasPageAccess, hasModuleAccess, loading: permissionsLoading } = useEmployeePortalPermissions({ employeeId });

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const status = await checkMySuperAdminStatus();
        setIsAdmin(status.is_superadmin === true);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

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

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter((item) => {
    // If admin, show all items
    if (isAdmin || user?.is_admin) return true;
    
    // If permissions are loading, show nothing (or show a loading state)
    if (permissionsLoading) return false;
    
    // Dashboard is always accessible
    if (item.id === 'dashboard') return true;
    
    // Check page-level permissions first
    if (item.path && !hasPageAccess(item.path)) {
      return false;
    }
    
    // Check module-level permissions
    if (item.module && !hasModuleAccess(item.module)) {
      return false;
    }
    
    return true;
  });

  return (
    <nav className={clsx('space-y-1', className)}>
      {permissionsLoading ? (
        <div className="text-sm text-muted-foreground px-3 py-2">
          Chargement des permissions...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-sm text-muted-foreground px-3 py-2">
          Aucune permission configurée
        </div>
      ) : (
        visibleItems.map((item) => {
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
        })
      )}
    </nav>
  );
}
