/**
 * Hook for employee portal permissions
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { employeePortalPermissionsAPI, type EmployeePortalPermissionSummary } from '@/lib/api/employee-portal-permissions';
import { handleApiError } from '@/lib/errors/api';

interface UseEmployeePortalPermissionsOptions {
  employeeId?: number;
}

export function useEmployeePortalPermissions(options?: UseEmployeePortalPermissionsOptions) {
  const { user } = useAuthStore();
  const { employeeId } = options || {};
  const [permissions, setPermissions] = useState<EmployeePortalPermissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const loadPermissions = async () => {
    // If employeeId is provided, use it; otherwise use user.id
    if (employeeId) {
      try {
        setLoading(true);
        setError(null);
        const summary = await employeePortalPermissionsAPI.getSummaryForEmployee(employeeId);
        setPermissions(summary);
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message || 'Erreur lors du chargement des permissions');
        // Don't fail silently - set empty permissions
        setPermissions({
          user_id: null,
          employee_id: employeeId,
          pages: [],
          modules: [],
          projects: [],
          clients: [],
          all_projects: false,
          all_clients: false,
        });
      } finally {
        setLoading(false);
      }
    } else if (user?.id) {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      
      try {
        setLoading(true);
        setError(null);
        const summary = await employeePortalPermissionsAPI.getSummary(userId);
        setPermissions(summary);
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message || 'Erreur lors du chargement des permissions');
        // Don't fail silently - set empty permissions
        setPermissions({
          user_id: userId,
          employee_id: null,
          pages: [],
          modules: [],
          projects: [],
          clients: [],
          all_projects: false,
          all_clients: false,
        });
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [user?.id, employeeId, reloadTrigger]);

  // Function to manually reload permissions
  const reload = () => {
    setReloadTrigger(prev => prev + 1);
  };

  /**
   * Check if user has access to a page
   */
  const hasPageAccess = (pagePath: string): boolean => {
    if (!permissions) return false;
    // If admin, allow all
    if (user?.is_admin) return true;
    // Check if page is in allowed pages or if all pages are allowed
    return permissions.pages.includes('*') || permissions.pages.includes(pagePath);
  };

  /**
   * Check if user has access to a module
   */
  const hasModuleAccess = (moduleName: string): boolean => {
    if (!permissions) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useEmployeePortalPermissions] hasModuleAccess(${moduleName}): permissions is null`);
      }
      return false;
    }
    // If admin, allow all
    if (user?.is_admin) return true;
    // Check if module is in allowed modules or if all modules are allowed
    const hasAccess = permissions.modules.includes('*') || permissions.modules.includes(moduleName);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useEmployeePortalPermissions] hasModuleAccess(${moduleName}):`, {
        hasAccess,
        modules: permissions.modules,
        includesModule: permissions.modules.includes(moduleName),
        includesWildcard: permissions.modules.includes('*'),
      });
    }
    return hasAccess;
  };

  /**
   * Check if user has access to a project
   */
  const hasProjectAccess = (projectId: number): boolean => {
    if (!permissions) return false;
    // If admin, allow all
    if (user?.is_admin) return true;
    // Check if all projects are allowed or if project is in allowed list
    return permissions.all_projects || permissions.projects.includes(projectId);
  };

  /**
   * Check if user has access to a client
   */
  const hasClientAccess = (clientId: number): boolean => {
    if (!permissions) return false;
    // If admin, allow all
    if (user?.is_admin) return true;
    // Check if all clients are allowed or if client is in allowed list
    return permissions.all_clients || permissions.clients.includes(clientId);
  };

  return {
    permissions,
    loading,
    error,
    hasPageAccess,
    hasModuleAccess,
    hasProjectAccess,
    hasClientAccess,
    reload, // Export reload function
  };
}
