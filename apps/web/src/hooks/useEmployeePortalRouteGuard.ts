/**
 * Hook pour protéger les routes du portail employé
 * Redirige automatiquement si l'utilisateur n'est pas dans le bon contexte
 */
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { employeesAPI } from '@/lib/api/employees';
import { useEmployeePortalPermissions } from './useEmployeePortalPermissions';
import { logger } from '@/lib/logger';

export function useEmployeePortalRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const employeeId = params?.id ? parseInt(String(params.id)) : undefined;
  const locale = (params?.locale as string) || 'fr';
  const { hasModuleAccess } = useEmployeePortalPermissions({ employeeId });
  
  useEffect(() => {
    if (!user || !pathname) return;
    
    const checkRoute = async () => {
      // Si on est dans le portail employé
      if (pathname.startsWith('/portail-employe/')) {
        // Vérifier que l'employé a les permissions pour cette route de module
        if (pathname.includes('/modules/')) {
          const moduleNameMatch = pathname.match(/\/portail-employe\/\d+\/modules\/([^\/]+)/);
          const moduleName = moduleNameMatch ? moduleNameMatch[1] : null;
          
          if (moduleName && employeeId) {
            if (!hasModuleAccess(moduleName)) {
              logger.warn('Employee attempting to access unauthorized module', {
                employeeId,
                moduleName,
                pathname,
              });
              router.replace(`/${locale}/portail-employe/${employeeId}/dashboard?error=no_permission`);
              return;
            }
          }
        }
      } else {
        // Si on est dans /dashboard mais que l'utilisateur est un employé
        if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/management/employes')) {
          try {
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
            const employee = await employeesAPI.getByUserId(userId);
            if (employee) {
              logger.warn('Employee attempting to access main dashboard, redirecting to portal', {
                userId: user.id,
                employeeId: employee.id,
                pathname,
              });
              router.replace(`/${locale}/portail-employe/${employee.id}/dashboard?error=employee_redirect`);
            }
          } catch (err) {
            // User might not be an employee, continue
            logger.debug('Employee check failed, continuing normally', { error: err });
          }
        }
      }
    };
    
    checkRoute();
  }, [pathname, user, employeeId, hasModuleAccess, router, locale]);
}
