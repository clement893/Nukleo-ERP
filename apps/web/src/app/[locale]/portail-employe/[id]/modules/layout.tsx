/**
 * Layout pour les modules ERP dans le portail employé
 * Vérifie les permissions et redirige si nécessaire
 */

'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Loading } from '@/components/ui';

export default function EmployeePortalModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const employeeId = params?.id ? parseInt(String(params.id)) : undefined;
  const locale = (params?.locale as string) || 'fr';
  const { hasModuleAccess, loading } = useEmployeePortalPermissions({ employeeId });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Extraire le nom du module depuis le pathname
  // Format: /[locale]/portail-employe/[id]/modules/[moduleName]/...
  const moduleNameMatch = pathname?.match(/\/portail-employe\/\d+\/modules\/([^\/]+)/);
  const moduleName = moduleNameMatch ? moduleNameMatch[1] : null;
  
  useEffect(() => {
    if (!loading && employeeId) {
      if (moduleName) {
        // Vérifier les permissions pour le module
        if (!hasModuleAccess(moduleName)) {
          // Rediriger vers le dashboard du portail si pas de permission
          router.replace(`/${locale}/portail-employe/${employeeId}/dashboard?error=no_permission`);
          setIsChecking(false);
          setIsAuthorized(false);
          return;
        }
      }
      setIsAuthorized(true);
      setIsChecking(false);
    }
  }, [loading, moduleName, employeeId, hasModuleAccess, router, locale, pathname]);
  
  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }
  
  if (!isAuthorized) {
    return null; // La redirection est en cours
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
