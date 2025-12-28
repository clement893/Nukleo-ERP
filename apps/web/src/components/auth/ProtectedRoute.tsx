'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { logger } from '@/lib/logger';
import { getErrorStatus } from '@/lib/errors';
import { useHydrated } from '@/hooks/useHydrated';

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
  const { user, token, setUser } = useAuthStore();
  const isHydrated = useHydrated();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const checkingRef = useRef(false);
  const lastUserRef = useRef(user);
  const lastTokenRef = useRef(token);
  const lastPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!isHydrated) {
      return;
    }

    // If user or token changed, update refs but only reset if going from authenticated to unauthenticated
    const userChanged = lastUserRef.current !== user;
    const tokenChanged = lastTokenRef.current !== token;
    const pathnameChanged = lastPathnameRef.current !== pathname;
    
    // Detect authentication state transitions
    const wasAuthenticated = !!lastUserRef.current && !!lastTokenRef.current;
    const isNowAuthenticated = !!user && !!token;
    
    if (userChanged || tokenChanged) {
      lastUserRef.current = user;
      lastTokenRef.current = token;
      
      // Only reset if we lost authentication (not if we gained it)
      if (wasAuthenticated && !isNowAuthenticated) {
        setIsAuthorized(false);
        setIsChecking(true);
        checkingRef.current = false;
      }
    }
    
    // Update pathname ref
    if (pathnameChanged) {
      lastPathnameRef.current = pathname;
    }

    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }

    // If already authorized and only pathname changed (navigation), skip check
    if (isAuthorized && isNowAuthenticated && !userChanged && !tokenChanged && pathnameChanged) {
      setIsChecking(false);
      return;
    }

    // If already authorized and we're still authenticated, don't check again
    if (isAuthorized && isNowAuthenticated && !userChanged && !tokenChanged) {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      checkingRef.current = true;
      setIsChecking(true);
      
      // Check authentication - prioritize sessionStorage if store not hydrated yet
      const tokenFromStorage = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
      const currentToken = token || tokenFromStorage;
      const currentUser = user;
      const hasUser = !!currentUser;
      const hasToken = !!currentToken;
      
      // If we have a token but no user, try to fetch user from API
      // This handles the case where Zustand persist hasn't hydrated yet but token exists
      let fetchedUser = currentUser;
      if (hasToken && !hasUser && typeof window !== 'undefined') {
        try {
          const { usersAPI } = await import('@/lib/api');
          const { transformApiUserToStoreUser } = await import('@/lib/auth/userTransform');
          const response = await usersAPI.getMe();
          if (response.data) {
            const userForStore = transformApiUserToStoreUser(response.data);
            setUser(userForStore);
            // Update refs to reflect the new user
            lastUserRef.current = userForStore;
            fetchedUser = userForStore;
          }
        } catch (err: unknown) {
          // If fetching user fails, log but don't block - might be network issue
          const statusCode = getErrorStatus(err);
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Failed to fetch user in ProtectedRoute', {
              error: err instanceof Error ? err.message : String(err),
              statusCode
            });
          }
          // Only fail if it's an auth error (401/403), not server errors (500)
          if (statusCode === 401 || statusCode === 403) {
            // Token is invalid, clear it and redirect
            if (typeof window !== 'undefined') {
              TokenStorage.removeTokens();
            }
            checkingRef.current = false;
            setIsChecking(false);
            setIsAuthorized(false);
            router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }
          // For other errors (500, network, etc.), continue with token check
        }
      }
      
      // Final auth check with potentially fetched user
      const finalHasUser = !!fetchedUser;
      const isAuth = finalHasUser && hasToken;
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug('ProtectedRoute auth check', {
          hasToken: !!tokenFromStorage,
          hasTokenFromStore: !!token,
          hasUser: !!user,
          fetchedUser: !!fetchedUser,
          isAuth,
          pathname,
          isAuthorized,
          wasAuthenticated,
          isNowAuthenticated: isAuth
        });
      }
      
      // If we just became authenticated (transition from unauthenticated to authenticated),
      // authorize immediately without additional checks
      if (!wasAuthenticated && isNowAuthenticated) {
        logger.debug('User just authenticated, authorizing immediately', { pathname });
        setIsAuthorized(true);
        checkingRef.current = false;
        setIsChecking(false);
        return;
      }
      
      if (!isAuth) {
        logger.debug('Not authenticated, redirecting to login', { pathname });
        checkingRef.current = false;
        setIsChecking(false);
        setIsAuthorized(false);
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check admin privileges if required
      if (requireAdmin) {
        // Check if user is admin OR superadmin (use fetchedUser if available)
        const userForAdminCheck = fetchedUser || user;
        let isAdmin = userForAdminCheck?.is_admin || false;
        
        // If not admin, check if user is superadmin
        if (!isAdmin) {
          const authToken = currentToken;
          try {
            if (authToken) {
              logger.debug('Checking superadmin status', {
                hasToken: !!authToken,
                tokenLength: authToken.length,
                userEmail: userForAdminCheck?.email
              });
              const status = await checkMySuperAdminStatus(authToken);
              isAdmin = status.is_superadmin;
              if (status.is_superadmin) {
                logger.debug('User is superadmin, granting admin access');
              } else {
                logger.debug('User is not superadmin', { userEmail: userForAdminCheck?.email });
              }
            } else {
              logger.warn('No token available for superadmin check', {
                hasTokenFromStorage: !!tokenFromStorage,
                hasTokenFromStore: !!token,
                userEmail: userForAdminCheck?.email
              });
            }
          } catch (err: unknown) {
            // If superadmin check fails with 401/422, token might be invalid or expired
            const statusCode = getErrorStatus(err);
            if (statusCode === 401 || statusCode === 422) {
              logger.warn('Superadmin check failed due to authentication error', {
                status: statusCode,
                hasToken: !!authToken,
                error: err instanceof Error ? err.message : String(err)
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
                } catch (retryErr: unknown) {
                  logger.warn('Retry also failed, redirecting to login', { error: retryErr instanceof Error ? retryErr.message : String(retryErr) });
                  checkingRef.current = false;
                  setIsChecking(false);
                  setIsAuthorized(false);
                  router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized`);
                  return;
                }
              } else {
                logger.warn('No valid token available, redirecting to login');
                checkingRef.current = false;
                setIsChecking(false);
                setIsAuthorized(false);
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
          checkingRef.current = false;
          setIsChecking(false);
          setIsAuthorized(false);
          router.replace('/dashboard?error=unauthorized');
          return;
        }
      }

      // Authorize access
      setIsAuthorized(true);
      checkingRef.current = false;
      setIsChecking(false);
    };

    // Check immediately
    checkAuth();
  }, [isHydrated, user, token, requireAdmin, isAuthorized]);

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

