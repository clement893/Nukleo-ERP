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
 * 
 * Priority:
 * 1. NEXT_PUBLIC_API_URL (explicit configuration)
 * 2. NEXT_PUBLIC_DEFAULT_API_URL (fallback for production)
 * 3. http://localhost:8000 (development fallback)
 * 
 * Note: In Next.js, NEXT_PUBLIC_* vars are embedded at build time.
 * For production, NEXT_PUBLIC_API_URL MUST be set via environment variables.
 * 
 * Automatically adds https:// if protocol is missing (for production).
 */
export const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Priority order: explicit API URL > default API URL > smart fallback > localhost (dev only)
  let url = process.env.NEXT_PUBLIC_API_URL 
    || process.env.NEXT_PUBLIC_DEFAULT_API_URL;
  
  // Default to localhost for development if nothing is set
  if (!url) {
    if (isProduction) {
      // In production, fail fast if API URL is not configured
      logger.error('NEXT_PUBLIC_API_URL is required in production but not set. Please set NEXT_PUBLIC_API_URL environment variable and rebuild.');
      throw new Error('NEXT_PUBLIC_API_URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
    }
    url = 'http://localhost:8000';
  }
  
  url = url.trim();
  
  // Log to help debug (only in browser, not SSR)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    logger.debug('API Client Configuration', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '(not set at build time)',
      NEXT_PUBLIC_DEFAULT_API_URL: process.env.NEXT_PUBLIC_DEFAULT_API_URL || '(not set)',
      finalApiUrl: url,
    });
  }
  
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  return url.replace(/\/$/, ''); // Remove trailing slash
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
      
      // Check if this is an authenticated endpoint
      const isAuthenticatedEndpoint = config.url?.includes('/users/me') || 
                                      config.url?.includes('/auth/me') || 
                                      config.url?.includes('/admin/') ||
                                      config.url?.includes('/v1/users/me') ||
                                      config.url?.includes('/v1/auth/me');
      
      if (isAuthenticatedEndpoint && !token) {
        // Reject the request immediately if it's an authenticated endpoint without token
        logger.warn('Blocking authenticated request without token', { 
          url: config.url,
          sessionStorageAvailable: typeof sessionStorage !== 'undefined'
        });
        const error = new Error('Authentication required: No token available') as any;
        error.config = config;
        error.isAxiosError = true;
        error.response = {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Authentication required: No token available' },
          headers: {},
          config: config as any,
        };
        return Promise.reject(error);
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Debug log to verify token is being sent
        if (isAuthenticatedEndpoint) {
          logger.debug('Sending authenticated request', { 
            url: config.url,
            hasToken: !!token,
            tokenPrefix: token.substring(0, 20) + '...'
          });
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
          // Use the current access token if available, otherwise use refresh_token
          const currentToken = TokenStorage.getToken();
          refreshTokenPromise = apiClient.post('/v1/auth/refresh', {
            token: currentToken || undefined,
            refresh_token: refreshToken,
          }).then(async response => {
            // Response format: { access_token: string, token_type: string }
            const { access_token } = response.data;
            await TokenStorage.setToken(access_token, refreshToken); // Keep same refresh token
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
  updateMe: (data: { name?: string; email?: string; first_name?: string; last_name?: string }) => {
    return apiClient.put('/v1/users/me', data);
  },
  getUser: (userId: string) => {
    return apiClient.get(`/v1/users/${userId}`);
  },
  getUsers: () => {
    return apiClient.get('/v1/users');
  },
  createUser: (data: {
    email: string;
    first_name?: string;
    last_name?: string;
    password: string;
    is_active?: boolean;
  }) => {
    return apiClient.post('/v1/users', data);
  },
  updateUser: (userId: string, data: {
    email?: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    is_active?: boolean;
  }) => {
    return apiClient.put(`/v1/users/${userId}`, data);
  },
  deleteUser: (userId: string) => {
    return apiClient.delete(`/v1/users/${userId}`);
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

export const projectsAPI = {
  list: () => {
    return apiClient.get('/v1/projects');
  },
  get: (projectId: string) => {
    return apiClient.get(`/v1/projects/${projectId}`);
  },
  create: (data: {
    name: string;
    description?: string;
    status?: 'active' | 'archived' | 'completed';
  }) => {
    return apiClient.post('/v1/projects', data);
  },
  update: (projectId: number, data: {
    name?: string;
    description?: string;
    status?: 'active' | 'archived' | 'completed';
  }) => {
    return apiClient.put(`/v1/projects/${projectId}`, data);
  },
  delete: (projectId: number) => {
    return apiClient.delete(`/v1/projects/${projectId}`);
  },
};

export const aiAPI = {
  health: () => {
    return apiClient.get('/v1/ai/health');
  },
  simpleChat: (message: string, systemPrompt?: string, model?: string) => {
    return apiClient.post('/v1/ai/chat/simple', { message, system_prompt: systemPrompt, model });
  },
  chat: (messages: Array<{ role: string; content: string }>, model?: string, temperature?: number, maxTokens?: number) => {
    return apiClient.post('/v1/ai/chat', { messages, model, temperature, max_tokens: maxTokens });
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

export const integrationsAPI = {
  list: () => {
    return apiClient.get('/v1/integrations/');
  },
  get: (integrationId: number) => {
    return apiClient.get(`/v1/integrations/${integrationId}`);
  },
  create: (data: {
    type: string;
    name: string;
    description?: string;
    config?: Record<string, unknown>;
    credentials?: Record<string, unknown>;
  }) => {
    return apiClient.post('/v1/integrations/', data);
  },
  update: (integrationId: number, data: {
    name?: string;
    description?: string;
    enabled?: boolean;
    config?: Record<string, unknown>;
    credentials?: Record<string, unknown>;
  }) => {
    return apiClient.put(`/v1/integrations/${integrationId}`, data);
  },
  toggle: (integrationId: number) => {
    return apiClient.patch(`/v1/integrations/${integrationId}/toggle`);
  },
  delete: (integrationId: number) => {
    return apiClient.delete(`/v1/integrations/${integrationId}`);
  },
};

export const apiSettingsAPI = {
  get: () => {
    return apiClient.get('/v1/api-settings/');
  },
  update: (data: {
    base_url?: string;
    rate_limit?: number;
    enable_webhooks?: boolean;
    webhook_url?: string;
    enable_logging?: boolean;
  }) => {
    return apiClient.put('/v1/api-settings/', data);
  },
};

// Export default for backward compatibility
export default apiClient;

// Named export for easier imports
export const api = apiClient;
export { apiClient };


