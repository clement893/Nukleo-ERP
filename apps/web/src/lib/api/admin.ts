/**
 * Admin API client for administrative operations.
 */
import { getApiUrl } from '../api';

const API_URL = getApiUrl().replace(/\/$/, '');

// Helper to get auth token
import { TokenStorage } from '@/lib/auth/tokenStorage';

function getAuthToken(): string {
  return TokenStorage.getToken() || '';
}

export interface MakeSuperAdminRequest {
  email: string;
}

export interface MakeSuperAdminResponse {
  success: boolean;
  message: string;
  user_id?: number | null;
  email?: string | null;
}

/**
 * Bootstrap the first superadmin user.
 * This endpoint uses a secret key and only works if no superadmin exists yet.
 */
export async function bootstrapSuperAdmin(
  email: string,
  bootstrapKey: string
): Promise<MakeSuperAdminResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/admin/bootstrap-superadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bootstrap-Key': bootstrapKey,
      },
      body: JSON.stringify({ email }),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 second timeout
        return controller.signal;
      })(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to bootstrap superadmin: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
      throw new Error(`Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`);
    }
    throw error;
  }
}

/**
 * Make a user superadmin.
 * Requires authentication and superadmin role.
 */
export async function makeSuperAdmin(
  email: string,
  token?: string
): Promise<MakeSuperAdminResponse> {
  try {
    const authToken = token || getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/admin/make-superadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ email }),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 second timeout
        return controller.signal;
      })(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to make superadmin: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
      throw new Error(`Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`);
    }
    throw error;
  }
}

/**
 * Check if a user has superadmin role.
 * Requires authentication and superadmin role.
 */
export async function checkSuperAdminStatus(
  email: string,
  token?: string
): Promise<{ is_superadmin: boolean }> {
  try {
    let authToken = token || getAuthToken();
    
    const makeRequest = async (tokenToUse: string) => {
      const response = await fetch(`${API_URL}/api/v1/admin/check-superadmin/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 10000); // 10 second timeout
          return controller.signal;
        })(),
      });
      return response;
    };

    let response = await makeRequest(authToken);

    // If 401, try to refresh token and retry
    if (response.status === 401) {
      const { TokenStorage } = await import('@/lib/auth/tokenStorage');
      const refreshToken = TokenStorage.getRefreshToken();
      
      if (refreshToken) {
        try {
          // Try to refresh the token
          const refreshResponse = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newToken = refreshData.access_token || refreshData.accessToken;
            const newRefreshToken = refreshData.refresh_token || refreshData.refreshToken;
            
            // Update token storage
            await TokenStorage.setToken(newToken, newRefreshToken);
            
            // Update Zustand store if available
            try {
              const { useAuthStore } = await import('@/lib/store');
              const store = useAuthStore.getState();
              if (store.setRefreshToken && newRefreshToken) {
                await store.setRefreshToken(newRefreshToken);
              }
              // Update token in store
              useAuthStore.setState({ token: newToken });
            } catch (storeError) {
              // Store update failed, but continue with token refresh
              console.warn('Failed to update auth store after token refresh:', storeError);
            }
            
            // Retry the original request with new token
            authToken = newToken;
            response = await makeRequest(authToken);
          } else {
            // Refresh failed, throw error
            throw new Error('Token expired and refresh failed. Please log in again.');
          }
        } catch (refreshError) {
          // Refresh failed, throw error
          throw new Error('Token expired and refresh failed. Please log in again.');
        }
      } else {
        // No refresh token available
        throw new Error('Token expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to check superadmin status: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
      throw new Error(`Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`);
    }
    throw error;
  }
}

