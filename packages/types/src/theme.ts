/**
 * Theme types for global platform theme management.
 * Generated from backend Pydantic schemas.
 */

export interface ThemeConfig {
  [key: string]: string | number | boolean | ThemeConfig;
}

export interface ThemeBase {
  name: string;
  display_name: string;
  description?: string | null;
  config: ThemeConfig;
}

export interface ThemeCreate extends ThemeBase {
  is_active?: boolean;
}

export interface ThemeUpdate {
  display_name?: string;
  description?: string | null;
  config?: ThemeConfig;
  is_active?: boolean;
}

export interface Theme extends ThemeBase {
  id: number;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ThemeListResponse {
  themes: Theme[];
  total: number;
  active_theme_id?: number | null;
}

export interface ThemeConfigResponse {
  name: string;
  display_name: string;
  config: ThemeConfig;
  updated_at: string;
}

