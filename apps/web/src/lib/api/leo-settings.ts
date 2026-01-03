/**
 * Leo Settings API
 * Client for managing Leo AI assistant settings
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface LeoSettings {
  tone: 'professionnel' | 'decontracte' | 'technique' | 'amical' | 'formel';
  approach: 'concis' | 'detaille' | 'avec_exemples' | 'pas_a_pas';
  language: 'fr' | 'en' | 'auto';
  custom_instructions: string;
  markdown_file_id: number | null;
  markdown_file_name: string | null;
  markdown_content: string | null;
  temperature: number;
  max_tokens: number | null;
  provider_preference: 'auto' | 'openai' | 'anthropic';
  model_preference: string | null;
  enable_context_memory: boolean;
  enable_erp_context?: boolean;
  max_context_items?: number;
}

export interface LeoSettingsUpdate {
  tone?: LeoSettings['tone'];
  approach?: LeoSettings['approach'];
  language?: LeoSettings['language'];
  custom_instructions?: string;
  temperature?: number;
  max_tokens?: number | null;
  provider_preference?: LeoSettings['provider_preference'];
  model_preference?: string | null;
  enable_context_memory?: boolean;
  enable_erp_context?: boolean;
  max_context_items?: number;
}

export interface SystemPromptResponse {
  system_prompt: string;
}

export interface MarkdownUploadResponse {
  success: boolean;
  filename: string;
  size: number;
}

/**
 * Get Leo settings for the current user
 */
export async function getLeoSettings(): Promise<LeoSettings> {
  const response = await apiClient.get<LeoSettings>('/v1/leo/settings');
  return extractApiData<LeoSettings>(response) as LeoSettings;
}

/**
 * Update Leo settings
 */
export async function updateLeoSettings(
  settings: LeoSettingsUpdate
): Promise<LeoSettings> {
  const response = await apiClient.put<LeoSettings>(
    '/v1/leo/settings',
    settings
  );
  return extractApiData<LeoSettings>(response) as LeoSettings;
}

/**
 * Upload a markdown file with Leo instructions
 */
export async function uploadMarkdownFile(
  file: File
): Promise<MarkdownUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<MarkdownUploadResponse>(
    '/v1/leo/settings/markdown/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return extractApiData<MarkdownUploadResponse>(response) as MarkdownUploadResponse;
}

/**
 * Download the current markdown file
 */
export async function downloadMarkdownFile(): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    '/v1/leo/settings/markdown/download',
    {
      responseType: 'blob',
    }
  );
  return response.data as Blob;
}

/**
 * Delete the current markdown file
 */
export async function deleteMarkdownFile(): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(
    '/v1/leo/settings/markdown'
  );
  return extractApiData<{ success: boolean }>(response) as { success: boolean };
}

/**
 * Get the generated system prompt from Leo settings
 */
export async function getSystemPrompt(): Promise<string> {
  const response = await apiClient.get<SystemPromptResponse>(
    '/v1/leo/settings/system-prompt'
  );
  const data = extractApiData<SystemPromptResponse>(response) as SystemPromptResponse;
  return data.system_prompt;
}

/**
 * Leo Settings API object
 */
export const leoSettingsAPI = {
  getSettings: getLeoSettings,
  updateSettings: updateLeoSettings,
  uploadMarkdown: uploadMarkdownFile,
  downloadMarkdown: downloadMarkdownFile,
  deleteMarkdown: deleteMarkdownFile,
  getSystemPrompt: getSystemPrompt,
};
