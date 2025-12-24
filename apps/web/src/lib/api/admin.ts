/**
 * Admin API client for administrative operations.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  const response = await fetch(`${API_URL}/api/v1/admin/bootstrap-superadmin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Key': bootstrapKey,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to bootstrap superadmin: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Make a user superadmin.
 * Requires authentication and superadmin role.
 */
export async function makeSuperAdmin(
  email: string,
  token?: string
): Promise<MakeSuperAdminResponse> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/admin/make-superadmin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to make superadmin: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if a user has superadmin role.
 * Requires authentication and superadmin role.
 */
export async function checkSuperAdminStatus(
  email: string,
  token?: string
): Promise<{ is_superadmin: boolean }> {
  const authToken = token || getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/admin/check-superadmin/${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to check superadmin status: ${response.statusText}`);
  }

  return response.json();
}

