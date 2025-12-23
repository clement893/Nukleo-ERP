/**
 * API Client Configuration
 * 
 * Axios client with automatic token injection, refresh token handling,
 * and comprehensive error management.
 * 
 * Features:
 * - Automatic JWT token injection in requests
 * - Automatic token refresh on 401 errors
 * - Request queuing to prevent concurrent refresh attempts
 * - Centralized error handling and conversion
 * 
 * @module lib/api
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleApiError, isClientError, isNetworkError } from './errors/api';
import { TokenStorage } from './auth/tokenStorage';
import { logger } from '@/lib/logger';

/**
 * API base URL with trailing slash removed to avoid double slashes
 * Falls back to localhost:8000 if NEXT_PUBLIC_API_URL is not set
 * Automatically adds https:// if protocol is missing (for production)
 * 
 * Note: In Next.js, NEXT_PUBLIC_* vars are embedded at build time
 * Make sure NEXT_PUBLIC_API_URL is set before building
 */
const getApiUrl = () => {
  // In production, default to the known backend URL if not set
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultUrl = isProduction 
    ? 'https://modelebackend-production-0590.up.railway.app'
    : 'http://localhost:8000';
  
  // Get and trim the URL to remove any whitespace
  let url = (process.env.NEXT_PUBLIC_API_URL || defaultUrl).trim();
  
  // Log to help debug (only in browser, not SSR)
  if (typeof window !== 'undefined') {
    console.log('[API Client] NODE_ENV:', process.env.NODE_ENV);
    console.log('[API Client] NEXT_PUBLIC_API_URL (raw):', process.env.NEXT_PUBLIC_API_URL);
    console.log('[API Client] NEXT_PUBLIC_API_URL (trimmed):', url);
    console.log('[API Client] Default URL:', defaultUrl);
    console.log('[API Client] Final API URL:', url);
  }
  
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

const API_URL = getApiUrl().replace(/\/$/, '');

/**
 * Axios client instance configured for API requests
 * Base URL includes /api prefix
 */
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Include cookies in requests
});

/**
 * Request interceptor: Automatically adds JWT token to Authorization header
 * Only runs in browser environment (not SSR)
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined' && config.headers) {
      const token = TokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Debug log to verify token is being sent
        if (config.url?.includes('/auth/me')) {
          console.log('[API Client] Sending request to /auth/me with token:', token.substring(0, 20) + '...');
        }
      } else {
        // Debug log if no token found
        if (config.url?.includes('/auth/me')) {
          console.warn('[API Client] No token found when requesting /auth/me');
        }
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Queue to prevent multiple simultaneous refresh token requests
 * When a refresh is in progress, subsequent 401 errors wait for the same promise
 */
let refreshTokenPromise: Promise<string> | null = null;

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    // Convert to AppError for better error handling
    const appError = handleApiError(error);

    // Handle 401 Unauthorized - try to refresh token or logout
    if (error.response?.status === 401) {
      const refreshToken = TokenStorage.getRefreshToken();
      
      // Try to refresh token if available
      if (refreshToken) {
        // If a refresh is already in progress, wait for it
        if (!refreshTokenPromise) {
          refreshTokenPromise = axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          }, {
            withCredentials: true, // Include cookies
          }).then(async response => {
            const { access_token, refresh_token: newRefreshToken } = response.data;
            await TokenStorage.setToken(access_token, newRefreshToken);
            return access_token;
          }).catch(async refreshError => {
            // Refresh failed, clear tokens and redirect
            await TokenStorage.removeTokens();
            window.location.href = '/auth/login?error=session_expired';
            throw refreshError;
          }).finally(() => {
            refreshTokenPromise = null; // Reset after completion
          });
        }
        
        try {
          const access_token = await refreshTokenPromise;
          
          // Retry original request
          if (error.config) {
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${access_token}`;
            return apiClient.request(error.config);
          }
        } catch (refreshError) {
          // Error already handled in the promise
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear tokens and redirect
        await TokenStorage.removeTokens();
        window.location.href = '/auth/login?error=unauthorized';
      }
    }

    // Handle network errors
    if (isNetworkError(appError)) {
      logger.error('Network error', appError, { endpoint: error.config?.url });
      // Could show a toast notification here
    }

    // Handle client errors (4xx) - don't redirect, let component handle
    if (isClientError(appError)) {
      // Component will handle the error display
      return Promise.reject(appError);
    }

    // Handle server errors (5xx) - show generic error
    logger.error('Server error', appError, { endpoint: error.config?.url, status: error.response?.status });
    return Promise.reject(appError);
  }
);

export const authAPI = {
  login: (email: string, password: string) => {
    return apiClient.post('/v1/auth/login', { email, password });
  },
  register: (email: string, password: string, name: string) => {
    return apiClient.post('/v1/auth/register', { email, password, name });
  },
  refresh: (refreshToken: string) => {
    return apiClient.post('/v1/auth/refresh', { refresh_token: refreshToken });
  },
  logout: () => {
    return apiClient.post('/v1/auth/logout');
  },
  getGoogleAuthUrl: (redirectUrl?: string) => {
    const params = redirectUrl ? { redirect: redirectUrl } : {};
    return apiClient.get('/v1/auth/google', { params });
  },
};

export const usersAPI = {
  getMe: () => {
    return apiClient.get('/v1/auth/me');
  },
  updateMe: (data: { name?: string; email?: string }) => {
    return apiClient.put('/users/me', data);
  },
  getUser: (userId: string) => {
    return apiClient.get(`/users/${userId}`);
  },
  getUsers: () => {
    return apiClient.get('/users');
  },
  deleteUser: (userId: string) => {
    return apiClient.delete(`/users/${userId}`);
  },
};

export const resourcesAPI = {
  getResources: () => {
    return apiClient.get('/resources');
  },
  getResource: (resourceId: string) => {
    return apiClient.get(`/resources/${resourceId}`);
  },
  createResource: (data: Record<string, unknown>) => {
    return apiClient.post('/resources', data);
  },
  updateResource: (resourceId: string, data: Record<string, unknown>) => {
    return apiClient.put(`/resources/${resourceId}`, data);
  },
  deleteResource: (resourceId: string) => {
    return apiClient.delete(`/resources/${resourceId}`);
  },
};

export const aiAPI = {
  health: () => {
    return apiClient.get('/ai/health');
  },
  simpleChat: (message: string, systemPrompt?: string, model?: string) => {
    return apiClient.post('/ai/chat/simple', { message, system_prompt: systemPrompt, model });
  },
  chat: (messages: Array<{ role: string; content: string }>, model?: string, temperature?: number, maxTokens?: number) => {
    return apiClient.post('/ai/chat', { messages, model, temperature, max_tokens: maxTokens });
  },
};

export const emailAPI = {
  health: () => {
    return apiClient.get('/email/health');
  },
  sendTest: (toEmail: string) => {
    return apiClient.post('/email/test', { to_email: toEmail });
  },
  sendWelcome: (toEmail: string) => {
    return apiClient.post('/email/welcome', { to_email: toEmail });
  },
  sendCustom: (data: {
    to_email: string;
    subject: string;
    html_content: string;
    text_content?: string;
    from_email?: string;
    from_name?: string;
  }) => {
    return apiClient.post('/email/send', data);
  },
};

export const subscriptionsAPI = {
  getPlans: (activeOnly: boolean = true) => {
    return apiClient.get('/v1/subscriptions/plans', {
      params: { active_only: activeOnly },
    });
  },
  getPlan: (planId: number) => {
    return apiClient.get(`/v1/subscriptions/plans/${planId}`);
  },
  getMySubscription: () => {
    return apiClient.get('/v1/subscriptions/me');
  },
  createCheckoutSession: (data: {
    plan_id: number;
    success_url: string;
    cancel_url: string;
    trial_days?: number;
  }) => {
    return apiClient.post('/v1/subscriptions/checkout', data);
  },
  createPortalSession: (returnUrl: string) => {
    return apiClient.post('/v1/subscriptions/portal', null, {
      params: { return_url: returnUrl },
    });
  },
  cancelSubscription: () => {
    return apiClient.post('/v1/subscriptions/cancel');
  },
  upgradePlan: (planId: number) => {
    return apiClient.post(`/v1/subscriptions/upgrade/${planId}`);
  },
  getPayments: () => {
    return apiClient.get('/v1/subscriptions/payments');
  },
};

export const teamsAPI = {
  list: () => {
    return apiClient.get('/v1/teams');
  },
  get: (teamId: string) => {
    return apiClient.get(`/v1/teams/${teamId}`);
  },
  create: (data: { name: string; description?: string; organization_id?: string }) => {
    return apiClient.post('/v1/teams', data);
  },
  update: (teamId: string, data: { name?: string; description?: string }) => {
    return apiClient.put(`/v1/teams/${teamId}`, data);
  },
  delete: (teamId: string) => {
    return apiClient.delete(`/v1/teams/${teamId}`);
  },
  getMembers: (teamId: string) => {
    return apiClient.get(`/v1/teams/${teamId}/members`);
  },
  addMember: (teamId: string, data: { user_id: string; role: string }) => {
    return apiClient.post(`/v1/teams/${teamId}/members`, data);
  },
  removeMember: (teamId: string, memberId: string) => {
    return apiClient.delete(`/v1/teams/${teamId}/members/${memberId}`);
  },
  updateMemberRole: (teamId: string, memberId: string, role: string) => {
    return apiClient.put(`/v1/teams/${teamId}/members/${memberId}`, { role });
  },
};

export const invitationsAPI = {
  list: (params?: { status?: string; organization_id?: string }) => {
    return apiClient.get('/v1/invitations', { params });
  },
  get: (invitationId: string) => {
    return apiClient.get(`/v1/invitations/${invitationId}`);
  },
  create: (data: { email: string; role: string; organization_id?: string }) => {
    return apiClient.post('/v1/invitations', data);
  },
  cancel: (invitationId: string) => {
    return apiClient.delete(`/v1/invitations/${invitationId}`);
  },
  resend: (invitationId: string) => {
    return apiClient.post(`/v1/invitations/${invitationId}/resend`);
  },
  accept: (invitationId: string, token: string) => {
    return apiClient.post(`/v1/invitations/${invitationId}/accept`, { token });
  },
};

// Export default for backward compatibility
export default apiClient;

// Named export for easier imports
export const api = apiClient;


