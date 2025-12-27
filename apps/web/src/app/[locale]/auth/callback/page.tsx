'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { usersAPI } from '@/lib/api';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors/api';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Since this page uses useSearchParams (which requires dynamic rendering),
// and it's a Client Component, it will be rendered dynamically automatically.

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  const handleAuthCallback = useCallback(async () => {
    // Support both formats: token (from Google OAuth callback) and access_token/refresh_token
    const accessToken = searchParams.get('token') || searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token') ?? undefined;

    logger.info('Auth callback started', { 
      hasToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      urlParams: Object.fromEntries(searchParams.entries())
    });

    if (!accessToken) {
      logger.error('No access token provided in callback URL');
      // Don't add redirect parameter to avoid loops
      router.push('/auth/login?error=No access token provided');
      return;
    }

    try {
      // Store tokens securely using TokenStorage (await to ensure it's stored before API calls)
      logger.debug('Storing token...');
      await TokenStorage.setToken(accessToken, refreshToken);
      logger.info('Tokens stored successfully');

      // Small delay to ensure token is available in sessionStorage
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify token is stored
      const storedToken = TokenStorage.getToken();
      logger.debug('Token verification', { 
        hasStoredToken: !!storedToken,
        tokenMatches: storedToken === accessToken 
      });

      // Fetch user info using API client
      // Note: apiClient automatically injects token from TokenStorage
      logger.debug('Fetching user info from API...', {
        tokenLength: accessToken.length,
        tokenPreview: `${accessToken.substring(0, 20)}...`
      });
      
      // Ensure token is available for the API call
      // The apiClient interceptor should pick it up from TokenStorage
      const storedTokenBeforeCall = TokenStorage.getToken();
      if (!storedTokenBeforeCall || storedTokenBeforeCall !== accessToken) {
        logger.warn('Token mismatch before API call, re-storing...', {
          storedTokenExists: !!storedTokenBeforeCall,
          tokensMatch: storedTokenBeforeCall === accessToken
        });
        await TokenStorage.setToken(accessToken, refreshToken);
        // Small delay to ensure token is available
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const response = await usersAPI.getMe();
      logger.info('User info received', { 
        hasUser: !!response.data,
        userEmail: response.data?.email,
        status: response.status
      });
      
      const user = response.data;

      if (user) {
        logger.info('Logging in user', { userId: user.id, email: user.email });
        
        // Ensure user object has the correct structure for the store
        const userForStore = {
          id: String(user.id),
          email: user.email,
          name: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.first_name || user.last_name || user.email,
          is_active: user.is_active ?? true,
          is_verified: false, // Default value, update if available
          is_admin: false, // Default value, update if available
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
        
        await login(userForStore, accessToken, refreshToken ?? undefined);
        
        // Verify login was successful
        const storedToken = TokenStorage.getToken();
        logger.debug('Login verification', {
          tokenStored: !!storedToken,
          tokenMatches: storedToken === accessToken
        });
        
        logger.info('Redirecting to dashboard');
        
        // Small delay to ensure store is updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        router.push('/dashboard');
      } else {
        throw new Error('No user data received');
      }
    } catch (err) {
      const appError = handleApiError(err);
      logger.error('Failed to complete authentication', appError instanceof Error ? appError : new Error(String(err)), { 
        errorMessage: appError.message,
        errorCode: appError.code,
        errorDetails: appError.details 
      });
      // Don't add redirect parameter to avoid loops
      router.push(`/auth/login?error=${encodeURIComponent(appError.message || 'Failed to get user info')}`);
    }
  }, [searchParams, router, login]);

  useEffect(() => {
    handleAuthCallback();
  }, [handleAuthCallback]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-muted dark:to-muted">
      <Container>
        <Card className="text-center">
          <div className="py-12">
            <Loading />
            <p className="mt-4 text-muted-foreground">Completing authentication...</p>
          </div>
        </Card>
      </Container>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-muted dark:to-muted">
          <Container>
            <Card className="text-center">
              <div className="py-12">
                <Loading />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </Card>
          </Container>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}