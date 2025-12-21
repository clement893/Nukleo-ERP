import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export default apiClient;

