/**
 * Context pour le portail employé
 * Fournit l'employeeId, les permissions, et les helpers de routage
 */
'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { getEmployeePortalModulePath } from '@/lib/constants/employee-portal-modules';

interface EmployeePortalContextValue {
  employeeId: number;
  locale: string;
  permissions: ReturnType<typeof useEmployeePortalPermissions>;
  getModulePath: (modulePath: string) => string;
  hasModuleAccess: (moduleName: string) => boolean;
}

const EmployeePortalContext = createContext<EmployeePortalContextValue | null>(null);

export function EmployeePortalProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : undefined;
  const locale = (params?.locale as string) || 'fr';
  const permissions = useEmployeePortalPermissions({ employeeId });
  
  if (!employeeId) {
    throw new Error('EmployeePortalProvider must be used within a route with [id]');
  }
  
  const getModulePath = useMemo(() => {
    return (modulePath: string) => {
      return getEmployeePortalModulePath(employeeId, modulePath, locale);
    };
  }, [employeeId, locale]);
  
  const value: EmployeePortalContextValue = useMemo(() => ({
    employeeId,
    locale,
    permissions,
    getModulePath,
    hasModuleAccess: permissions.hasModuleAccess,
  }), [employeeId, locale, permissions, getModulePath]);
  
  return (
    <EmployeePortalContext.Provider value={value}>
      {children}
    </EmployeePortalContext.Provider>
  );
}

export function useEmployeePortal() {
  const context = useContext(EmployeePortalContext);
  if (!context) {
    throw new Error('useEmployeePortal must be used within EmployeePortalProvider');
  }
  return context;
}
