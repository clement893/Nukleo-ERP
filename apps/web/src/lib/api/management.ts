/**
 * Management Module API
 * Unified API client for management operations
 * 
 * This module provides a unified interface for all management operations:
 * - Teams
 * - Employees
 */

// Re-export teams and employees APIs
export { teamsAPI } from './teams';
export { employeesAPI } from './employees';

// Import for unified interface
import { teamsAPI } from './teams';
import { employeesAPI } from './employees';

/**
 * Unified Management API
 * Provides access to all management operations through a single interface
 */
export const managementAPI = {
  teams: teamsAPI,
  employees: employeesAPI,
};
