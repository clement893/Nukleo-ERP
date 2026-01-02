/**
 * Custom Widgets API Client
 * 
 * API functions for managing custom dashboard widgets
 * 
 * @module custom-widgets
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface CustomWidgetConfig {
  title?: string;
  period?: string;
  refresh_interval?: number;
  filters?: Record<string, any>;
  html_content?: string;
  css_content?: string;
  api_endpoint?: string;
  chart_type?: string;
  chart_config?: Record<string, any>;
  text_content?: string;
  text_format?: 'markdown' | 'html' | 'plain';
  iframe_url?: string;
  iframe_sandbox?: string[];
  template?: string;
}

export interface CustomWidgetDataSource {
  type: 'api' | 'query' | 'static';
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  transform?: string;
  data_path?: string;
}

export interface CustomWidgetStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  borderWidth?: number;
  boxShadow?: string;
}

export interface CustomWidget {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  type: 'html' | 'api' | 'chart' | 'text' | 'iframe';
  config: CustomWidgetConfig;
  data_source?: CustomWidgetDataSource;
  style?: CustomWidgetStyle;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomWidgetCreate {
  name: string;
  description?: string;
  type: 'html' | 'api' | 'chart' | 'text' | 'iframe';
  config: CustomWidgetConfig;
  data_source?: CustomWidgetDataSource;
  style?: CustomWidgetStyle;
  is_public?: boolean;
}

export interface CustomWidgetUpdate {
  name?: string;
  description?: string;
  type?: 'html' | 'api' | 'chart' | 'text' | 'iframe';
  config?: CustomWidgetConfig;
  data_source?: CustomWidgetDataSource;
  style?: CustomWidgetStyle;
  is_public?: boolean;
}

/**
 * Custom Widgets API
 */
export const customWidgetsAPI = {
  /**
   * List all custom widgets for the current user
   */
  async list(params?: {
    include_public?: boolean;
    type?: string;
  }): Promise<CustomWidget[]> {
    const queryParams = new URLSearchParams();
    if (params?.include_public) {
      queryParams.append('include_public', 'true');
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }

    const response = await apiClient.get<CustomWidget[]>(
      `/v1/custom-widgets?${queryParams.toString()}`
    );

    return extractApiData<CustomWidget[]>(response);
  },

  /**
   * Get a custom widget by ID
   */
  async get(widgetId: number): Promise<CustomWidget> {
    const response = await apiClient.get<CustomWidget>(
      `/v1/custom-widgets/${widgetId}`
    );

    return extractApiData<CustomWidget>(response);
  },

  /**
   * Create a new custom widget
   */
  async create(widget: CustomWidgetCreate): Promise<CustomWidget> {
    const response = await apiClient.post<CustomWidget>(
      '/v1/custom-widgets',
      widget
    );

    return extractApiData<CustomWidget>(response);
  },

  /**
   * Update a custom widget
   */
  async update(widgetId: number, updates: CustomWidgetUpdate): Promise<CustomWidget> {
    const response = await apiClient.put<CustomWidget>(
      `/v1/custom-widgets/${widgetId}`,
      updates
    );

    return extractApiData<CustomWidget>(response);
  },

  /**
   * Delete a custom widget
   */
  async delete(widgetId: number): Promise<void> {
    await apiClient.delete(`/v1/custom-widgets/${widgetId}`);
  },

  /**
   * Duplicate a custom widget
   */
  async duplicate(widgetId: number): Promise<CustomWidget> {
    const response = await apiClient.post<CustomWidget>(
      `/v1/custom-widgets/${widgetId}/duplicate`
    );

    return extractApiData<CustomWidget>(response);
  },
};
