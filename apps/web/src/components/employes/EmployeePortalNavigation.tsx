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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { useState, useEffect } from 'react';
import { EMPLOYEE_PORTAL_MODULES } from '@/lib/constants/employee-portal-modules';
import * as Icons from 'lucide-react';

interface EmployeePortalNavigationProps {
  employeeId: number;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isBasePage?: boolean; // Page de base toujours visible
}

// Pages de base du portail employé (toujours visibles)
const BASE_PAGES: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: 'dashboard',
    icon: LayoutDashboard,
    isBasePage: true,
  },
  {
    id: 'tasks',
    label: 'Mes tâches',
    path: 'taches',
    icon: CheckSquare,
    isBasePage: true,
  },
  {
    id: 'projects',
    label: 'Mes projets',
    path: 'projets',
    icon: FolderKanban,
    isBasePage: true,
  },
  {
    id: 'timesheets',
    label: 'Mes feuilles de temps',
    path: 'feuilles-de-temps',
    icon: Clock,
    isBasePage: true,
  },
  {
    id: 'leo',
    label: 'Mon Leo',
    path: 'leo',
    icon: Bot,
    isBasePage: true,
  },
  {
    id: 'deadlines',
    label: 'Mes deadlines',
    path: 'deadlines',
    icon: Calendar,
    isBasePage: true,
  },
  {
    id: 'expenses',
    label: 'Mes comptes de dépenses',
    path: 'depenses',
    icon: Receipt,
    isBasePage: true,
  },
  {
    id: 'vacations',
    label: 'Mes vacances',
    path: 'vacances',
    icon: Plane,
    isBasePage: true,
  },
  {
    id: 'profile',
    label: 'Mon profil',
    path: 'profil',
    icon: User,
    isBasePage: true,
  },
];

// Helper pour obtenir l'icône depuis le nom
function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || LayoutDashboard;
}

export function EmployeePortalNavigation({ employeeId, className }: EmployeePortalNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const { hasModuleAccess, loading: permissionsLoading } = useEmployeePortalPermissions({ employeeId });

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
    const match = pathname.match(/\/portail-employe\/\d+\/(.+)$/);
    if (!match) {
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

  // Get enabled ERP modules
  const enabledModules = EMPLOYEE_PORTAL_MODULES.filter((module) => {
    if (isAdmin || user?.is_admin) return true;
    if (permissionsLoading) return false;
    const hasAccess = hasModuleAccess(module.id);
    // Debug: log permissions check
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EmployeePortalNavigation] Module ${module.id}: hasAccess=${hasAccess}`);
    }
    return hasAccess;
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  return (
    <nav className={clsx('space-y-1', className)}>
      {permissionsLoading ? (
        <div className="text-sm text-muted-foreground px-3 py-2">
          Chargement des permissions...
        </div>
      ) : (
        <>
          {/* Pages de base - toujours visibles */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Mon Portail Employé
            </div>
            {BASE_PAGES.map((item) => {
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
          </div>

          {/* Modules ERP - si activés */}
          {enabledModules.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Modules ERP
              </div>
              {enabledModules.map((module) => {
                const Icon = getIcon(module.icon);
                const isExpanded = expandedModules.has(module.id);
                const hasSubPages = module.subPages && module.subPages.length > 0;

                return (
                  <div key={module.id} className="mb-1">
                    {hasSubPages ? (
                      <>
                        <button
                          onClick={() => toggleModule(module.id)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="flex-1 text-left">{module.label}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-8 mt-1 space-y-1">
                            {module.subPages?.map((subPage) => {
                              const isSubPageActive = pathname === subPage.path || pathname.startsWith(subPage.path + '/');
                              return (
                                <Link
                                  key={subPage.path}
                                  href={subPage.path}
                                  className={clsx(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                    isSubPageActive
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  <span>{subPage.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={module.basePath}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          pathname === module.basePath || pathname.startsWith(module.basePath + '/')
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{module.label}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </nav>
  );
}
