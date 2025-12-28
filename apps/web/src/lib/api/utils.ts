/**
 * API Utilities
 * Helper functions for working with API responses
 */

import type { ApiResponse } from '@modele/types';

/**
 * Type guard to check if response is ApiResponse
 */
export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as ApiResponse<T>).success === 'boolean'
  );
}

/**
 * Extract data from API response (handles both ApiResponse<T> and direct T)
 */
export function extractApiData<T>(response: ApiResponse<T> | T): T {
  if (isApiResponse(response)) {
    return response.data as T;
  }
  return response as T;
}
