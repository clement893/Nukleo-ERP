import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleApiError, isClientError, isNetworkError } from './errors/api';
import { TokenStorage } from './auth/tokenStorage';

// Remove trailing slash from API URL to avoid double slashes
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined' && config.headers) {
      const token = TokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Queue pour éviter les refresh tokens multiples simultanés
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
        // Si un refresh est déjà en cours, attendre celui-ci
        if (!refreshTokenPromise) {
          refreshTokenPromise = axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          }).then(response => {
            const { access_token, refresh_token: newRefreshToken } = response.data;
            TokenStorage.setToken(access_token);
            if (newRefreshToken) {
              TokenStorage.setRefreshToken(newRefreshToken);
            }
            return access_token;
          }).catch(refreshError => {
            // Refresh failed, clear tokens and redirect
            TokenStorage.removeTokens();
            window.location.href = '/auth/login?error=session_expired';
            throw refreshError;
          }).finally(() => {
            refreshTokenPromise = null; // Réinitialiser après
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
          // Erreur déjà gérée dans la promise
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear tokens and redirect
        TokenStorage.removeTokens();
        window.location.href = '/auth/login?error=unauthorized';
      }
    }

    // Handle network errors
    if (isNetworkError(appError)) {
      console.error('Network error:', appError.message);
      // Could show a toast notification here
    }

    // Handle client errors (4xx) - don't redirect, let component handle
    if (isClientError(appError)) {
      // Component will handle the error display
      return Promise.reject(appError);
    }

    // Handle server errors (5xx) - show generic error
    console.error('Server error:', appError.message);
    return Promise.reject(appError);
  }
);

export const authAPI = {
  login: (email: string, password: string) => {
    return apiClient.post('/auth/login', { email, password });
  },
  register: (email: string, password: string, name: string) => {
    return apiClient.post('/auth/register', { email, password, name });
  },
  refresh: (refreshToken: string) => {
    return apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  },
  logout: () => {
    return apiClient.post('/auth/logout');
  },
  getGoogleAuthUrl: () => {
    return apiClient.get('/auth/google');
  },
};

export const usersAPI = {
  getMe: () => {
    return apiClient.get('/users/me');
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
};

// Export default for backward compatibility
export default apiClient;

// Named export for easier imports
export const api = apiClient;


