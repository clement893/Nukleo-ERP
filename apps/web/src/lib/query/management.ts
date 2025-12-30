/**
 * React Query hooks for Management Module
 * Unified hooks for all management operations
 */

// Note: Management currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Management API
export { managementAPI, teamsAPI, employeesAPI } from '../api/management';

// Unified query keys for management module
export const managementKeys = {
  all: ['management'] as const,
  teams: () => [...managementKeys.all, 'teams'] as const,
  team: (id: number) => [...managementKeys.teams(), id] as const,
  employees: () => [...managementKeys.all, 'employees'] as const,
  employee: (id: number) => [...managementKeys.employees(), id] as const,
};
