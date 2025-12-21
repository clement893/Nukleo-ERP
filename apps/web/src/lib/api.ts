import axios from 'axios';

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
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
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
  createResource: (data: any) => {
    return apiClient.post('/resources', data);
  },
  updateResource: (resourceId: string, data: any) => {
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

export default apiClient;

