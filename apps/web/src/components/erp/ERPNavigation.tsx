/**
 * ERP Portal Navigation Component
 * 
 * Navigation sidebar for the ERP/Employee portal.
 * Displays navigation items organized by ERP modules.
 * 
 * @module ERPNavigation
 * @see {@link ../../lib/constants/portal.ts EMPLOYEE_PORTAL_NAVIGATION}
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { EMPLOYEE_PORTAL_NAVIGATION } from '@/lib/constants/portal';
import { hasPermission, type PortalUser } from '@/lib/portal/utils';
import { useAuthStore } from '@/lib/store';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { clsx } from 'clsx';

/**
 * ERP Navigation Props
 */
interface ERPNavigationProps {
  className?: string;
}

/**
 * ERP Portal Navigation Component
 * 
 * Renders a navigation sidebar with ERP module menu items.
 * Only shows items the user has permission to access.
 * Items are organized by ERP modules (CRM, Orders, Inventory, Accounting, Reports).
 * 
 * @example
 * ```tsx
 * <ERPNavigation />
 * ```
 */
export function ERPNavigation({ className }: ERPNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { hasPageAccess, hasModuleAccess, loading: permissionsLoading } = useEmployeePortalPermissions();

  // Filter navigation items based on permissions
  const visibleItems = EMPLOYEE_PORTAL_NAVIGATION.filter((item) => {
    // If admin, show all items
    if (user?.is_admin) return true;
    
    // If permissions are loading, show nothing (or show a loading state)
    if (permissionsLoading) return false;
    
    // Check portal permissions first (page-level)
    if (item.path && !hasPageAccess(item.path)) {
      return false;
    }
    
    // Check module-level permissions
    if (item.module && !hasModuleAccess(item.module)) {
      return false;
    }
    
    // Also check RBAC permissions (for backward compatibility)
    if (item.permission && user) {
      const portalUser: PortalUser = {
        ...user,
        roles: user.is_admin ? ['admin'] : ['employee'],
        permissions: [],
      };
      if (!hasPermission(portalUser, item.permission).hasPermission) {
        return false;
      }
    }
    
    return true;
  });

  // Group items by module
  const itemsByModule = visibleItems.reduce((acc, item) => {
    const module = item.module || 'other';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(item);
    return acc;
  }, {} as Record<string, typeof visibleItems>);

  // Show loading state
  if (permissionsLoading) {
    return (
      <nav className={clsx('flex flex-col space-y-6', className)}>
        <div className="px-4 py-2 text-sm text-muted-foreground">
          Chargement des permissions...
        </div>
      </nav>
    );
  }

  return (
    <nav className={clsx('flex flex-col space-y-6', className)}>
      {/* Link to employee portal */}
      <div className="px-4 py-2">
        <Link
          href="/erp/dashboard"
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
            pathname === '/erp/dashboard' || pathname?.startsWith('/erp/')
              ? 'border-2 border-primary text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
          )}
        >
          <span className="text-lg" aria-hidden="true">🏠</span>
          <span>Mon Portail</span>
        </Link>
      </div>

      {Object.entries(itemsByModule).map(([module, items]) => (
        <div key={module}>
          {module !== 'other' && (
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {module === 'crm' ? 'CRM' : 
               module === 'orders' ? 'Orders' :
               module === 'inventory' ? 'Inventory' :
               module === 'accounting' ? 'Accounting' :
               module === 'reports' ? 'Reports' :
               module === 'settings' ? 'Settings' : module}
            </h3>
          )}
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
              
              return (
                <div key={item.id}>
                  <Link
                    href={item.path}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'border-2 border-primary text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                    )}
                  >
                    {item.icon && (
                      <span className="text-lg" aria-hidden="true">
                        {/* Icon will be rendered based on icon name */}
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  
                  {/* Render children if active */}
                  {isActive && item.children && item.children.length > 0 && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.path;
                        return (
                          <Link
                            key={child.id}
                            href={child.path}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors',
                              isChildActive
                                ? 'border-2 border-primary text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

