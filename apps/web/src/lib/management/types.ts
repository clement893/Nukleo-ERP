/**
 * Types for Management Dashboard Widgets
 */

export type ManagementWidgetType =
  | 'employees-stats'
  | 'time-tracking-summary'
  | 'vacation-overview'
  | 'expense-summary'
  | 'hours-chart'
  | 'team-capacity-chart'
  | 'vacation-calendar'
  | 'time-distribution'
  | 'pending-requests'
  | 'recent-employees'
  | 'upcoming-vacations'
  | 'recent-time-entries'
  | 'vacation-calendar-view'
  | 'team-availability';

export interface ManagementWidgetConfig {
  id: string;
  widget_type: ManagementWidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

export interface ManagementDashboardConfig {
  id: string;
  name: string;
  layouts: ManagementWidgetConfig[];
  filters?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    team_id?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ManagementWidgetProps {
  widgetId: string;
  config?: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
}

export interface WidgetMetadata {
  type: ManagementWidgetType;
  name: string;
  description: string;
  category: 'statistics' | 'charts' | 'lists' | 'calendar';
  defaultSize: { w: number; h: number };
  icon?: string;
}
