/**
 * User Preferences API
 * API client for user preferences endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface UserPreferences {
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface PreferenceResponse {
  key: string;
  value: string | number | boolean | object | null;
}

/**
 * User Preferences API client
 */
export const preferencesAPI = {
  /**
   * Get all preferences for the current user
   */
  getAll: async (): Promise<UserPreferences> => {
    const response = await apiClient.get<UserPreferences>('/v1/users/preferences');
    const data = extractApiData<UserPreferences>(response);
    return data || {};
  },

  /**
   * Get a specific preference by key
   */
  get: async (key: string): Promise<PreferenceResponse | null> => {
    try {
      const response = await apiClient.get<PreferenceResponse>(`/v1/users/preferences/${key}`);
      return extractApiData<PreferenceResponse>(response);
    } catch (error) {
      return null;
    }
  },

  /**
   * Set a single preference
   */
  set: async (key: string, value: unknown): Promise<PreferenceResponse> => {
    const response = await apiClient.put<PreferenceResponse>(
      `/v1/users/preferences/${key}`,
      { value }
    );
    return extractApiData<PreferenceResponse>(response) || { key, value: value as string | number | boolean | object | null };
  },

  /**
   * Set multiple preferences at once
   */
  setAll: async (preferences: UserPreferences): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      '/v1/users/preferences',
      preferences
    );
    return extractApiData(response) || { success: true, message: 'Preferences updated successfully' };
  },

  /**
   * Delete a specific preference
   */
  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/v1/users/preferences/${key}`);
  },

  /**
   * Delete all preferences for the current user
   */
  deleteAll: async (): Promise<void> => {
    await apiClient.delete('/v1/users/preferences');
  },
};
