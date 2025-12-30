/**
 * Analytics Module API
 * Unified API client for analytics operations
 * 
 * This module provides a unified interface for all analytics operations:
 * - Analytics
 * - Insights
 * - Reports
 */

// Re-export Analytics APIs as unified interface
export { analyticsAPI } from './analytics';
export { insightsAPI } from './insights';
export { reportsAPI } from './reports';

// Import for unified interface
import { analyticsAPI } from './analytics';
import { insightsAPI } from './insights';
import { reportsAPI } from './reports';

/**
 * Unified Analytics API
 * Provides access to all analytics operations through a single interface
 */
export const analyticsModuleAPI = {
  analytics: analyticsAPI,
  insights: insightsAPI,
  reports: reportsAPI,
};
