/**
 * Theme API client for managing platform themes.
 */
import type {
  Theme,
  ThemeCreate,
  ThemeUpdate,
  ThemeListResponse,
  ThemeConfigResponse,
} from '@modele/types/theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get auth token (adjust based on your auth implementation)
function getAuthToken(): string {
  // This should be replaced with your actual auth token retrieval logic
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || '';
  }
  return '';
}

/**
 * Get the currently active theme configuration.
 * Public endpoint - no authentication required.
 */
export async function getActiveTheme(): Promise<ThemeConfigResponse> {
  const response = await fetch(`${API_URL}/api/v1/themes/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Always fetch fresh theme
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch active theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all themes.
 * Requires authentication and superadmin role.
 */
export async function listThemes(
  token?: string,
  skip: number = 0,
  limit: number = 100
): Promise<ThemeListResponse> {
  const authToken = token || getAuthToken();
  const response = await fetch(
    `${API_URL}/api/v1/themes?skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch themes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific theme by ID.
 * Requires authentication and superadmin role.
 */
export async function getTheme(
  themeId: number,
  token?: string
): Promise<Theme> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/themes/${themeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new theme.
 * Requires authentication and superadmin role.
 */
export async function createTheme(
  themeData: ThemeCreate,
  token?: string
): Promise<Theme> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/themes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(themeData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing theme.
 * Requires authentication and superadmin role.
 */
export async function updateTheme(
  themeId: number,
  themeData: ThemeUpdate,
  token?: string
): Promise<Theme> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/themes/${themeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(themeData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to update theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Activate a theme (deactivates all others).
 * Requires authentication and superadmin role.
 */
export async function activateTheme(
  themeId: number,
  token?: string
): Promise<Theme> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/themes/${themeId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to activate theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a theme.
 * Requires authentication and superadmin role.
 * Cannot delete the active theme.
 */
export async function deleteTheme(
  themeId: number,
  token?: string
): Promise<void> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/themes/${themeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to delete theme: ${response.statusText}`);
  }
}

