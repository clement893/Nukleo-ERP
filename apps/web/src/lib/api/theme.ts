/**
 * Theme API client for managing platform themes.
 * Uses apiClient for centralized authentication and error handling.
 */
import type {
  Theme,
  ThemeCreate,
  ThemeUpdate,
  ThemeListResponse,
  ThemeConfigResponse,
} from '@modele/types';
import { logger } from '@/lib/logger';
import { apiClient } from './client';
import { TokenStorage } from '@/lib/auth/tokenStorage';

/**
 * Helper function to extract data from FastAPI response.
 * FastAPI returns data directly, not wrapped in ApiResponse.
 * apiClient.get returns response.data from axios, which is already the FastAPI response.
 * This function handles both cases for compatibility.
 */
function extractFastApiData<T>(response: unknown): T {
  // FastAPI returns data directly, and apiClient.get already returns response.data from axios
  // So response is already the FastAPI data, not wrapped in ApiResponse
  if (!response) {
    return response as T;
  }
  
  if (typeof response === 'object') {
    // Check if response has 'data' property (ApiResponse wrapper case)
    // This happens if apiClient wraps the response in ApiResponse format
    if ('data' in response && (response as { data?: unknown }).data !== undefined) {
      const data = (response as { data: unknown }).data;
      // If data exists, return it
      if (data !== null && data !== undefined) {
        return data as T;
      }
    }
    
    // Check if response has 'success' property (ApiResponse format)
    // If it does, it's wrapped in ApiResponse, so extract data
    if ('success' in response && 'data' in response) {
      const apiResponse = response as { success: boolean; data?: T };
      if (apiResponse.data !== undefined) {
        return apiResponse.data;
      }
    }
    
    // Otherwise, FastAPI returned the data directly (most common case)
    // response is already ThemeListResponse, Theme, etc.
    return response as T;
  }
  
  return response as T;
}

/**
 * Default theme configuration used when backend is unavailable
 */
const DEFAULT_THEME_CONFIG: ThemeConfigResponse = {
  id: 0,
  name: 'default',
  display_name: 'Default Theme',
  config: {
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    danger_color: '#EF4444',
    warning_color: '#F59E0B',
    info_color: '#06B6D4',
    success_color: '#10B981',
    font_family: 'Inter',
    border_radius: '0.5rem',
  },
};

/**
 * Get the currently active theme configuration.
 * Public endpoint - no authentication required.
 * Falls back to default theme if backend is unavailable.
 */
export async function getActiveTheme(): Promise<ThemeConfigResponse> {
  try {
    const response = await apiClient.get<ThemeConfigResponse>('/v1/themes/active', {
      timeout: 5000, // 5 second timeout
    });
    
    // FastAPI returns data directly
    return extractFastApiData<ThemeConfigResponse>(response);
  } catch (error) {
    // Handle network errors, timeouts, and connection refused
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        logger.warn(`Theme fetch timeout. Using default theme. Make sure the backend is running.`);
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('Network Error')) {
        logger.warn(`Backend not available. Using default theme. Make sure the backend is running.`);
      } else {
        logger.warn(`Failed to fetch theme: ${error.message} - Using default theme.`);
      }
    }
    // Return default theme instead of throwing
    return DEFAULT_THEME_CONFIG;
  }
}

/**
 * List all themes.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function listThemes(
  token?: string,
  skip: number = 0,
  limit: number = 100
): Promise<ThemeListResponse> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.get<ThemeListResponse>(
        `/v1/themes?skip=${skip}&limit=${limit}`
      );
      return extractFastApiData<ThemeListResponse>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.get<ThemeListResponse>(
    `/v1/themes?skip=${skip}&limit=${limit}`
  );
  
  // Debug: log the response structure
  if (process.env.NODE_ENV === 'development') {
    logger.debug('listThemes response', {
      responseType: typeof response,
      hasData: response && typeof response === 'object' && 'data' in response,
      hasThemes: response && typeof response === 'object' && 'themes' in response,
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
    });
  }
  
  const extracted = extractFastApiData<ThemeListResponse>(response);
  
  // Debug: log the extracted data
  if (process.env.NODE_ENV === 'development') {
    logger.debug('listThemes extracted', {
      hasThemes: extracted && typeof extracted === 'object' && 'themes' in extracted,
      themesCount: extracted && typeof extracted === 'object' && 'themes' in extracted 
        ? (extracted as ThemeListResponse).themes?.length || 0 
        : 0,
      total: extracted && typeof extracted === 'object' && 'total' in extracted
        ? (extracted as ThemeListResponse).total
        : undefined,
    });
  }
  
  return extracted;
}

/**
 * Get a specific theme by ID.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function getTheme(
  themeId: number,
  token?: string
): Promise<Theme> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.get<Theme>(`/v1/themes/${themeId}`);
      return extractFastApiData<Theme>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.get<Theme>(`/v1/themes/${themeId}`);
  return extractFastApiData<Theme>(response);
}

/**
 * Create a new theme.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function createTheme(
  themeData: ThemeCreate,
  token?: string
): Promise<Theme> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.post<Theme>('/v1/themes', themeData);
      return extractFastApiData<Theme>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.post<Theme>('/v1/themes', themeData);
  return extractFastApiData<Theme>(response);
}

/**
 * Update an existing theme.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function updateTheme(
  themeId: number,
  themeData: ThemeUpdate,
  token?: string
): Promise<Theme> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.put<Theme>(`/v1/themes/${themeId}`, themeData);
      return extractFastApiData<Theme>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.put<Theme>(`/v1/themes/${themeId}`, themeData);
  return extractFastApiData<Theme>(response);
}

/**
 * Activate a theme (deactivates all others).
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function activateTheme(
  themeId: number,
  token?: string
): Promise<Theme> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.post<Theme>(`/v1/themes/${themeId}/activate`);
      return extractFastApiData<Theme>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.post<Theme>(`/v1/themes/${themeId}/activate`);
  return extractFastApiData<Theme>(response);
}

/**
 * Update the active theme mode (light/dark/system).
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function updateActiveThemeMode(
  mode: 'light' | 'dark' | 'system',
  token?: string
): Promise<void> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      await apiClient.put<void>('/v1/themes/active/mode', { mode });
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
    return;
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  await apiClient.put<void>('/v1/themes/active/mode', { mode });
}

/**
 * Delete a theme.
 * Requires authentication and superadmin role.
 * Cannot delete the active theme.
 * Uses apiClient for automatic token management and error handling.
 */
export async function deleteTheme(
  themeId: number,
  token?: string
): Promise<void> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      await apiClient.delete<void>(`/v1/themes/${themeId}`);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
    return;
  }
  
  // Use apiClient which automatically handles token from TokenStorage
  await apiClient.delete<void>(`/v1/themes/${themeId}`);
}
