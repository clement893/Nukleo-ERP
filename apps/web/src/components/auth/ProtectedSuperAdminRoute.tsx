'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { checkSuperAdminStatus } from '@/lib/api/admin';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui';
import { Shield, AlertCircle } from 'lucide-react';

interface ProtectedSuperAdminRouteProps {
  children: ReactNode;
}

/**
 * Protected Super Admin Route Component
 * Prevents unauthorized access to routes requiring superadmin privileges
 * Only superadmins can access these routes
 */
export default function ProtectedSuperAdminRoute({ children }: ProtectedSuperAdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for Zustand persist to hydrate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check authentication - also check token in sessionStorage as fallback
      const tokenFromStorage = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
      const isAuth = isAuthenticated() || (tokenFromStorage && user);
      
      if (!isAuth) {
        logger.debug('Not authenticated, redirecting to login', { pathname });
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check superadmin status
      try {
        if (user?.email) {
          const authToken = token || tokenFromStorage;
          const status = await checkSuperAdminStatus(user.email, authToken || undefined);
          setIsSuperAdmin(status.is_superadmin);
          
          if (!status.is_superadmin) {
            logger.debug('User is not superadmin, redirecting', { 
              email: user.email, 
              pathname 
            });
            router.replace('/dashboard?error=unauthorized_superadmin');
            return;
          }
        } else {
          // Fallback: check is_admin if email is not available
          // This is a temporary fallback - ideally all users should have email
          if (!user?.is_admin) {
            logger.debug('User is not admin, redirecting', { pathname });
            router.replace('/dashboard?error=unauthorized_superadmin');
            return;
          }
          setIsSuperAdmin(true);
        }
      } catch (err) {
        logger.error('Failed to check superadmin status', err);
        // On error, fallback to is_admin check
        if (!user?.is_admin) {
          router.replace('/dashboard?error=unauthorized_superadmin');
          return;
        }
        setIsSuperAdmin(true);
      }

      // Authorize access
      setIsAuthorized(true);
      setIsChecking(false);
    };

    // Check immediately
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.is_admin, token, router, pathname]);

  // Show loader during verification
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600 dark:text-gray-400">
            Vérification des permissions...
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not superadmin (should not reach here, but safety check)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Accès Refusé
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Seuls les superadmins peuvent accéder à cette page.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

