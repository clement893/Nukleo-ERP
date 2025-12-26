/**
 * API Client with Error Handling
 * Centralized API client with automatic error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@modele/types';
import { getApiUrl } from '../api';
import { TokenStorage } from '../auth/tokenStorage';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = `${getApiUrl().replace(/\/$/, '')}/api`) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important: Include cookies in requests
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add authentication token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add authentication token if available
        if (typeof window !== 'undefined' && config.headers) {
          const token = TokenStorage.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        logger.debug('API request', {
          method: config.method,
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        const appError = handleApiError(error);
        logger.error('API response error', appError, {
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(appError);
      }
    );
  }

  /**
   * Generic request method to reduce duplication
   */
  private async request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      let response: AxiosResponse<ApiResponse<T>>;
      
      if (method === 'get' || method === 'delete') {
        response = await this.client[method](url, config);
      } else {
        response = await this.client[method](url, data, config);
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, undefined, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data, config);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('patch', url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, undefined, config);
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

export const apiClient = new ApiClient();
