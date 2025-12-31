/**
 * Hook for employee portal permissions
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { employeePortalPermissionsAPI, type EmployeePortalPermissionSummary } from '@/lib/api/employee-portal-permissions';
import { handleApiError } from '@/lib/errors/api';

export function useEmployeePortalPermissions() {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<EmployeePortalPermissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
    
    const loadPermissions = async () => {
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
    };

    loadPermissions();
  }, [user?.id]);

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
    if (!permissions) return false;
    // If admin, allow all
    if (user?.is_admin) return true;
    // Check if module is in allowed modules or if all modules are allowed
    return permissions.modules.includes('*') || permissions.modules.includes(moduleName);
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
  };
}
