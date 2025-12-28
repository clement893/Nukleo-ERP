/**
 * useAuth Hook
 * Centralized authentication logic and token management
 */

import { useCallback, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI, usersAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { logger } from '@/lib/logger';
import { getErrorStatus } from '@/lib/errors';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, login, logout, setUser, setError, error } = useAuthStore();

  /**
   * Login with email and password
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setError(null);
        const response = await authAPI.login(credentials.email, credentials.password);
        const { access_token, user: userData } = response.data;

        // Adapt user data to match store format
        const userForStore = {
          id: String(userData.id),
          email: userData.email,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : userData.first_name || userData.last_name || userData.email,
          is_active: userData.is_active ?? true,
          is_verified: false, // Default value, update if available
          is_admin: false, // Default value, update if available
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        };

        // Store tokens securely
        await TokenStorage.setToken(access_token);

        // Update store
        login(userForStore, access_token);

        return { success: true, user: userData };
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message);
        return { success: false, error: appError };
      }
    },
    [login, setError]
  );

  /**
   * Register new user
   */
  const handleRegister = useCallback(
    async (data: RegisterData) => {
      try {
        setError(null);
        const response = await authAPI.register(data.email, data.password, data.name);
        const userData = response.data;

        // Auto-login after registration
        const loginResponse = await authAPI.login(data.email, data.password);
        const { access_token, refresh_token } = loginResponse.data;

        await TokenStorage.setToken(access_token, refresh_token);

        login(userData, access_token);
        return { success: true, user: userData };
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message);
        return { success: false, error: appError };
      }
    },
    [login, setError]
  );

  /**
   * Logout user
   */
  const handleLogout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore logout errors but log them
      logger.error('Logout error', err instanceof Error ? err : new Error(String(err)));
    } finally {
      // Clear tokens securely
      TokenStorage.removeTokens();
      logout();
      router.push('/auth/login');
    }
  }, [logout, router]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = TokenStorage.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refresh(refreshTokenValue);
      const { access_token, refresh_token: newRefreshToken } = response.data;

      await TokenStorage.setToken(access_token, newRefreshToken);

      useAuthStore.getState().setToken(access_token);
      return { success: true };
    } catch (err) {
      // Refresh failed, logout user
      handleLogout();
      return { success: false, error: err };
    }
  }, [handleLogout]);

  /**
   * Check if user is authenticated and refresh token if needed
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = async () => {
      // Wait a bit for Zustand persist to hydrate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const storedToken = TokenStorage.getToken();
      const storedRefreshToken = TokenStorage.getRefreshToken();

      // If we have a refresh token but no access token, try to refresh
      if (!storedToken && storedRefreshToken) {
        await refreshToken();
        return; // Exit early, refreshToken will handle user fetch
      }

      // If we have a token but no user, try to fetch user (non-critical, use startTransition)
      if (storedToken && !user) {
        startTransition(async () => {
          try {
            const response = await usersAPI.getMe();
            if (response.data) {
              setUser(response.data);
            }
          } catch (err: unknown) {
            // Token might be invalid, try refresh
            const statusCode = getErrorStatus(err);
            if (storedRefreshToken && (statusCode === 401 || statusCode === 422)) {
              await refreshToken();
            } else if (statusCode === 401 || statusCode === 422) {
              // No refresh token or refresh failed, logout
              handleLogout();
            }
            // For other errors, don't logout (might be network issue)
          }
        });
      }
    };

    checkAuth();
  }, [user, refreshToken, setUser, handleLogout]);

  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshToken,
  };
}

