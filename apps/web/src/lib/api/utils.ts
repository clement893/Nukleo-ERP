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
 * FastAPI may return data directly or wrapped in ApiResponse
 */
export function extractApiData<T>(response: ApiResponse<T> | T | any): T {
  // If response is already the expected type (array, object, etc.), return it
  if (!response || typeof response !== 'object') {
    return response as T;
  }
  
  // Check if it's an ApiResponse wrapper
  if (isApiResponse(response)) {
    // If response.data exists, use it; otherwise response itself might be the data
    return (response.data !== undefined && response.data !== null ? response.data : response) as T;
  }
  
  // If response has a 'data' property, try to extract it
  if ('data' in response && response.data !== undefined) {
    return response.data as T;
  }
  
  // Otherwise, return response as-is (FastAPI might return data directly)
  return response as T;
}
