/**
 * Employee Portal Sidebar Component
 * 
 * Sidebar component for employee portal using the same design as main dashboard Sidebar
 * 
 * @module EmployeePortalSidebar
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import { clsx } from 'clsx';
import { ChevronDown, Search, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { EMPLOYEE_PORTAL_MODULES, getEmployeePortalModules } from '@/lib/constants/employee-portal-modules';
import * as Icons from 'lucide-react';
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
  Bell,
} from 'lucide-react';

interface EmployeePortalSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  employeeId: number;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Pages de base du portail employé (toujours visibles)
const BASE_PAGES: NavItem[] = [
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
  {
    id: 'notifications',
    label: 'Mes notifications',
    path: 'notifications',
    icon: Bell,
  },
];

// Helper pour obtenir l'icône depuis le nom
function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || LayoutDashboard;
}

export default function EmployeePortalSidebar({
  isOpen: controlledIsOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
  employeeId,
}: EmployeePortalSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const { hasModuleAccess, loading: permissionsLoading } = useEmployeePortalPermissions({ employeeId });

  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleClose = onClose || (() => setInternalIsOpen(false));

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

  // Get enabled ERP modules with transformed paths for employee portal
  const enabledModules = useMemo(() => {
    if (permissionsLoading || !employeeId) return [];
    
    // Transformer les chemins pour le portail employé et filtrer selon les permissions
    return getEmployeePortalModules(employeeId, locale).filter((module) => {
      const originalModule = EMPLOYEE_PORTAL_MODULES.find(m => m.id === module.id);
      return originalModule && hasModuleAccess(originalModule.id);
    });
  }, [employeeId, locale, permissionsLoading, hasModuleAccess]);

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Filter navigation based on search query
  const filteredBasePages = useMemo(() => {
    if (!searchQuery.trim()) return BASE_PAGES;
    const query = searchQuery.toLowerCase();
    return BASE_PAGES.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.path.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return enabledModules;
    const query = searchQuery.toLowerCase();
    return enabledModules.filter(
      (module) =>
        module.label.toLowerCase().includes(query) ||
        module.id.toLowerCase().includes(query)
    );
  }, [enabledModules, searchQuery]);

  // Auto-open modules when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const modulesToOpen = new Set<string>();
      filteredModules.forEach((module) => {
        if (module.subPages && module.subPages.length > 0) {
          modulesToOpen.add(module.id);
        }
      });
      if (modulesToOpen.size > 0) {
        setOpenModules((prev) => {
          const newSet = new Set(prev);
          modulesToOpen.forEach((moduleId) => newSet.add(moduleId));
          return newSet;
        });
      }
    }
  }, [searchQuery, filteredModules]);

  // Render navigation item with Nukleo design
  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    const href = `/portail-employe/${employeeId}${item.path === 'dashboard' ? '/dashboard' : `/${item.path}`}`;
    const Icon = item.icon;

    const className = clsx(
      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
      active
        ? 'bg-nukleo-gradient/10 text-primary-500 dark:text-nukleo-lavender backdrop-blur-sm border border-primary-500/20'
        : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm'
    );

    return (
      <Link key={item.id} href={href} className={className}>
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-nukleo-gradient rounded-r-full" />
        )}

        {/* Icon with subtle background */}
        <span
          className={clsx(
            'w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-200',
            active
              ? 'bg-primary-500/10 text-primary-500'
              : 'text-current opacity-70 group-hover:opacity-100'
          )}
        >
          <Icon className="w-5 h-5" />
        </span>

        {/* Text */}
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  // Render module group
  const renderModuleGroup = (module: typeof EMPLOYEE_PORTAL_MODULES[0]) => {
    const Icon = getIcon(module.icon);
    const isExpanded = openModules.has(module.id);
    const hasSubPages = module.subPages && module.subPages.length > 0;
    const isModuleActive =
      pathname === module.basePath || pathname.startsWith(module.basePath + '/');

    if (hasSubPages) {
      return (
        <div key={module.id} className="space-y-1">
          <button
            onClick={() => toggleModule(module.id)}
            className={clsx(
              'group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              isModuleActive
                ? 'bg-primary-500/5 text-primary-500 dark:text-nukleo-lavender'
                : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
            )}
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={clsx(
                  'w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-200',
                  isModuleActive
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'text-current opacity-70 group-hover:opacity-100'
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
              {!collapsed && <span className="truncate">{module.label}</span>}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {module.subPages?.length || 0}
                </span>
                <ChevronDown
                  className={clsx(
                    'w-4 h-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </div>
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="space-y-0.5 ml-4 border-l-2 border-border/30 pl-3">
              {module.subPages?.map((subPage) => {
                const isSubPageActive =
                  pathname === subPage.path || pathname.startsWith(subPage.path + '/');
                return (
                  <Link
                    key={subPage.path}
                    href={subPage.path}
                    className={clsx(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isSubPageActive
                        ? 'bg-nukleo-gradient/10 text-primary-500 dark:text-nukleo-lavender backdrop-blur-sm border border-primary-500/20'
                        : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm'
                    )}
                  >
                    {isSubPageActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-nukleo-gradient rounded-r-full" />
                    )}
                    <span className="truncate">{subPage.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Link
          key={module.id}
          href={module.basePath}
          className={clsx(
            'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            isModuleActive
              ? 'bg-nukleo-gradient/10 text-primary-500 dark:text-nukleo-lavender backdrop-blur-sm border border-primary-500/20'
              : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm'
          )}
        >
          {isModuleActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-nukleo-gradient rounded-r-full" />
          )}
          <span
            className={clsx(
              'w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-200',
              isModuleActive
                ? 'bg-primary-500/10 text-primary-500'
                : 'text-current opacity-70 group-hover:opacity-100'
            )}
          >
            <Icon className="w-5 h-5" />
          </span>
          {!collapsed && <span className="truncate">{module.label}</span>}
        </Link>
      );
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 h-screen bg-background/95 backdrop-blur-xl border-r border-border/50 flex flex-col shadow-xl',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-0 md:w-0' : 'w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed && 'md:overflow-hidden'
        )}
      >
        {/* Header with Aurora Borealis Gradient */}
        <div
          className={clsx(
            'relative border-b border-border/50 flex-shrink-0 transition-all duration-300 overflow-hidden',
            collapsed ? 'p-0' : 'p-4'
          )}
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-nukleo-gradient opacity-10" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
              backgroundSize: '200px 200px',
            }}
          />

          {!collapsed && (
            <div className="relative flex items-center gap-3">
              <Link href={`/portail-employe/${employeeId}/dashboard`} className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-xl bg-nukleo-gradient flex items-center justify-center shadow-lg">
                  <span
                    className="text-white font-black text-xl font-nukleo"
                  >
                    N
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-base font-black text-foreground font-nukleo"
                  >
                    Mon Portail Employé
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {user?.email?.split('@')[0] || 'Employé'}
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Search bar with glassmorphism */}
        {!collapsed && (
          <div className="p-3 border-b border-border/50 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm bg-muted/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {permissionsLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement des permissions...
            </div>
          ) : (
            <>
              {/* Pages de base */}
              <div className="mb-4">
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-70">
                    <LayoutDashboard className="w-4 h-4" />
                  </span>
                  {!collapsed && <span>Mon Portail Employé</span>}
                </div>
                {!collapsed && (
                  <div className="space-y-0.5 mt-1 ml-4 border-l-2 border-border/30 pl-3">
                    {filteredBasePages.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Aucun résultat
                      </div>
                    ) : (
                      filteredBasePages.map((item) => renderNavItem(item))
                    )}
                  </div>
                )}
              </div>

              {/* Modules ERP */}
              {filteredModules.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-70">
                      <FolderKanban className="w-4 h-4" />
                    </span>
                    {!collapsed && <span>Modules ERP</span>}
                  </div>
                  {!collapsed && (
                    <div className="space-y-0.5 ml-4 border-l-2 border-border/30 pl-3">
                      {filteredModules.map((module) => renderModuleGroup(module))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer with user profile */}
        {!collapsed && (
          <div className="border-t border-border/50 p-3 flex-shrink-0 space-y-2 bg-muted/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="w-9 h-9 rounded-full bg-nukleo-gradient flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-sm font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleWithIcon />
              <Button
                variant="primary"
                size="sm"
                onClick={logout}
                className="flex-1 text-xs bg-nukleo-gradient hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Déconnexion
              </Button>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-20 w-6 h-6 bg-background border-2 border-border/50 rounded-full flex items-center justify-center hover:bg-muted hover:border-primary-500/50 transition-all shadow-md hidden md:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
