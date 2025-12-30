/**
 * React Query hooks for Analytics Module
 * Unified hooks for all analytics operations
 */

// Note: Analytics currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Analytics API
export { analyticsModuleAPI, analyticsAPI, insightsAPI, reportsAPI } from '../api/analytics-unified';

// Unified query keys for analytics module
export const analyticsKeys = {
  all: ['analytics'] as const,
  metrics: () => [...analyticsKeys.all, 'metrics'] as const,
  insights: () => [...analyticsKeys.all, 'insights'] as const,
  insight: (id: number) => [...analyticsKeys.insights(), id] as const,
  reports: () => [...analyticsKeys.all, 'reports'] as const,
  report: (id: number) => [...analyticsKeys.reports(), id] as const,
};
