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

import { usePathname, useParams } from 'next/navigation';
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
import { useState } from 'react';
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
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  // Le hook useEmployeePortalPermissions gère automatiquement la mise à jour des permissions
  // via handlePermissionsUpdate() qui utilise directement le cache mis à jour par savePermissions().
  // Pas besoin d'écouter l'événement ici car le hook le fait déjà et met à jour les permissions
  // automatiquement, ce qui déclenchera un re-render de ce composant.
  const { hasModuleAccess, loading: permissionsLoading } = useEmployeePortalPermissions({ employeeId });
  
  // Écouter les événements de mise à jour des permissions depuis d'autres composants
  // NOTE: Le hook useEmployeePortalPermissions gère déjà la mise à jour via handlePermissionsUpdate()
  // qui utilise directement le cache mis à jour. On n'a pas besoin d'appeler reloadPermissions() ici
  // car cela invaliderait le cache inutilement.
  // Le hook mettra automatiquement à jour les permissions via setPermissions() dans handlePermissionsUpdate(),
  // ce qui déclenchera un re-render de ce composant.
  // useEffect supprimé car le hook gère déjà la mise à jour automatiquement

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
  // IMPORTANT: Ne pas bypasser les permissions même si l'utilisateur est admin
  // car on veut voir le portail tel que l'employé le voit avec ses permissions
  const enabledModules = EMPLOYEE_PORTAL_MODULES.filter((module) => {
    // Si on charge encore les permissions, ne rien afficher pour éviter les flashs
    if (permissionsLoading) return false;
    
    // Vérifier les permissions de l'employé (pas de l'utilisateur connecté)
    const hasAccess = hasModuleAccess(module.id);
    
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

  // Render navigation item with Nukleo design
  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    const href = `/${locale}/portail-employe/${employeeId}${item.path === 'dashboard' ? '/dashboard' : `/${item.path}`}`;
    const Icon = item.icon;

    const className = clsx(
      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
      active
        ? 'bg-gradient-to-r from-[#5F2B75]/10 via-[#523DC9]/10 to-[#6B1817]/10 text-[#523DC9] dark:text-[#A7A2CF] backdrop-blur-sm border border-[#523DC9]/20'
        : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm'
    );

    return (
      <Link key={item.id} href={href} className={className}>
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#5F2B75] via-[#523DC9] to-[#6B1817] rounded-r-full" />
        )}
        
        {/* Icon with subtle background */}
        <span className={clsx(
          "w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-200",
          active 
            ? "bg-[#523DC9]/10 text-[#523DC9]" 
            : "text-current opacity-70 group-hover:opacity-100"
        )}>
          <Icon className="w-5 h-5" />
        </span>
        
        {/* Text */}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className={clsx('space-y-1', className)}>
      {permissionsLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Chargement des permissions...
        </div>
      ) : (
        <>
          {/* Pages de base - toujours visibles */}
          <div className="mb-4">
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-70">
                <LayoutDashboard className="w-4 h-4" />
              </span>
              <span>Mon Portail Employé</span>
            </div>
            <div className="space-y-0.5 mt-1 ml-4 border-l-2 border-border/30 pl-3">
              {BASE_PAGES.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Modules ERP - si activés */}
          {enabledModules.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-70">
                  <FolderKanban className="w-4 h-4" />
                </span>
                <span>Modules ERP</span>
              </div>
              <div className="space-y-0.5 ml-4 border-l-2 border-border/30 pl-3">
                {enabledModules.map((module) => {
                  const Icon = getIcon(module.icon);
                  const isExpanded = expandedModules.has(module.id);
                  const hasSubPages = module.subPages && module.subPages.length > 0;
                  const isModuleActive = pathname === module.basePath || pathname.startsWith(module.basePath + '/');

                  return (
                    <div key={module.id} className="space-y-1">
                      {hasSubPages ? (
                        <>
                          <button
                            onClick={() => toggleModule(module.id)}
                            className={clsx(
                              'group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                              isModuleActive
                                ? 'bg-[#523DC9]/5 text-[#523DC9] dark:text-[#A7A2CF]'
                                : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                            )}
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={clsx(
                                "w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-200",
                                isModuleActive 
                                  ? "bg-[#523DC9]/10 text-[#523DC9]" 
                                  : "text-current opacity-70 group-hover:opacity-100"
                              )}>
                                <Icon className="w-5 h-5" />
                              </span>
                              <span className="truncate">{module.label}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                                {module.subPages?.length || 0}
                              </span>
                              <ChevronDown className={clsx(
                                'w-4 h-4 transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )} />
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="space-y-0.5 ml-4 border-l-2 border-border/30 pl-3">
                              {module.subPages?.map((subPage) => {
                                const isSubPageActive = pathname === subPage.path || pathname.startsWith(subPage.path + '/');
                                return (
                                  <Link
                                    key={subPage.path}
                                    href={subPage.path}
                                    className={clsx(
                                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                      isSubPageActive
                                        ? 'bg-gradient-to-r from-[#5F2B75]/10 via-[#523DC9]/10 to-[#6B1817]/10 text-[#523DC9] dark:text-[#A7A2CF] backdrop-blur-sm border border-[#523DC9]/20'
                                        : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm'
                                    )}
                                  >
                                    {isSubPageActive && (
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#5F2B75] via-[#523DC9] to-[#6B1817] rounded-r-full" />
                                    )}
                                    <span className="truncate">{subPage.name}</span>
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
                            'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                            isModuleActive
                              ? 'bg-gradient-to-r from-[#5F2B75]/10 via-[#523DC9]/10 to-[#6B1817]/10 text-[#523DC9] dark:text-[#A7A2CF] backdrop-blur-sm border border-[#523DC9]/20'
                              : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm'
                          )}
                        >
                          {isModuleActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#5F2B75] via-[#523DC9] to-[#6B1817] rounded-r-full" />
                          )}
                          <span className={clsx(
                            "w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-200",
                            isModuleActive 
                              ? "bg-[#523DC9]/10 text-[#523DC9]" 
                              : "text-current opacity-70 group-hover:opacity-100"
                          )}>
                            <Icon className="w-5 h-5" />
                          </span>
                          <span className="truncate">{module.label}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
