'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { logger } from '@/lib/logger';

/**
 * Protected Route Component
 * 
 * Prevents unauthorized access to routes requiring authentication.
 * Automatically redirects to login if user is not authenticated.
 * Prevents flash of unauthenticated content during auth check.
 * 
 * @example
 * ```tsx
 * // Basic protection
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Admin-only route
 * <ProtectedRoute requireAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
interface ProtectedRouteProps {
  /** Child components to protect */
  children: ReactNode;
  /** Require admin privileges */
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for Zustand persist to hydrate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check authentication - also check token in sessionStorage as fallback
      const tokenFromStorage = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
      const isAuth = isAuthenticated() || (tokenFromStorage && user);
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug('ProtectedRoute auth check', {
          isAuthenticated: isAuthenticated(),
          hasToken: !!tokenFromStorage,
          hasUser: !!user,
          isAuth
        });
      }
      
      if (!isAuth) {
        logger.debug('Not authenticated, redirecting to login', { pathname });
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check admin privileges if required
      if (requireAdmin) {
        // Check if user is admin OR superadmin
        let isAdmin = user?.is_admin || false;
        
        // If not admin, check if user is superadmin
        if (!isAdmin) {
          const authToken = tokenFromStorage || token;
          try {
            if (authToken) {
              logger.debug('Checking superadmin status', {
                hasToken: !!authToken,
                tokenLength: authToken.length,
                userEmail: user?.email
              });
              const status = await checkMySuperAdminStatus(authToken);
              isAdmin = status.is_superadmin;
              if (status.is_superadmin) {
                logger.debug('User is superadmin, granting admin access');
              } else {
                logger.debug('User is not superadmin', { userEmail: user?.email });
              }
            } else {
              logger.warn('No token available for superadmin check', {
                hasTokenFromStorage: !!tokenFromStorage,
                hasTokenFromStore: !!token,
                userEmail: user?.email
              });
            }
          } catch (err: any) {
            // If superadmin check fails with 401/422, token might be invalid or expired
            if (err?.response?.status === 401 || err?.response?.status === 422) {
              logger.warn('Superadmin check failed due to authentication error', {
                status: err?.response?.status,
                hasToken: !!authToken,
                error: err?.message
              });
              
              // Try to get fresh token from storage one more time
              const freshToken = TokenStorage.getToken();
              if (freshToken && freshToken !== authToken) {
                logger.debug('Found fresh token, retrying superadmin check');
                try {
                  const retryStatus = await checkMySuperAdminStatus(freshToken);
                  isAdmin = retryStatus.is_superadmin;
                  if (retryStatus.is_superadmin) {
                    logger.debug('User is superadmin after retry, granting admin access');
                  }
                } catch (retryErr: any) {
                  logger.warn('Retry also failed, redirecting to login', { error: retryErr?.message });
                  router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized`);
                  return;
                }
              } else {
                logger.warn('No valid token available, redirecting to login');
                router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized`);
                return;
              }
            } else {
              // For other errors, fallback to is_admin check
              logger.warn('Failed to check superadmin status, using is_admin fallback', { error: String(err) });
            }
          }
        }
        
        if (!isAdmin) {
          router.replace('/dashboard?error=unauthorized');
          return;
        }
      }

      // Authorize access
      setIsAuthorized(true);
      setIsChecking(false);
    };

    // Check immediately
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_admin, requireAdmin, router, pathname]);

  // Show loader during verification
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

