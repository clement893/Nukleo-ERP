/**
 * Capacity Validation Utilities
 * Validation functions for capacity-related data
 */

import type { Employee } from '@/lib/api/employees';
import type { PublicHoliday } from './capacity';

/**
 * Validate estimated hours
 */
export function validateEstimatedHours(hours: number | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (hours === null || hours === undefined) {
    return { valid: true }; // Null is allowed (optional field)
  }
  
  if (typeof hours !== 'number' || isNaN(hours)) {
    return { valid: false, error: 'Estimated hours must be a number' };
  }
  
  if (hours < 0) {
    return { valid: false, error: 'Estimated hours cannot be negative' };
  }
  
  if (hours > 10000) {
    return { valid: false, error: 'Estimated hours seems unreasonably high (>10000h)' };
  }
  
  return { valid: true };
}

/**
 * Validate capacity hours per week
 */
export function validateCapacityHoursPerWeek(hours: number | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (hours === null || hours === undefined) {
    return { valid: true }; // Null defaults to 35
  }
  
  if (typeof hours !== 'number' || isNaN(hours)) {
    return { valid: false, error: 'Capacity hours must be a number' };
  }
  
  if (hours < 0) {
    return { valid: false, error: 'Capacity hours cannot be negative' };
  }
  
  if (hours > 168) {
    return { valid: false, error: 'Capacity hours cannot exceed 168 (hours in a week)' };
  }
  
  return { valid: true };
}

/**
 * Validate absence date range
 */
export function validateAbsenceDates(
  startDate: string,
  endDate: string
): {
  valid: boolean;
  error?: string;
} {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Start date and end date are required' };
  }
  
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T23:59:59Z');
  
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date format' };
  }
  
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date format' };
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }
  
  // Check for unreasonably long absences (>1 year)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return { valid: false, error: 'Absence period cannot exceed 365 days' };
  }
  
  return { valid: true };
}

/**
 * Validate public holiday
 */
export function validatePublicHoliday(holiday: PublicHoliday): {
  valid: boolean;
  error?: string;
} {
  if (!holiday.name || holiday.name.trim().length === 0) {
    return { valid: false, error: 'Holiday name is required' };
  }
  
  if (!holiday.date) {
    return { valid: false, error: 'Holiday date is required' };
  }
  
  const date = new Date(holiday.date + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid holiday date format' };
  }
  
  if (holiday.year !== null && holiday.year !== undefined) {
    if (holiday.year < 1900 || holiday.year > 2100) {
      return { valid: false, error: 'Holiday year must be between 1900 and 2100' };
    }
  }
  
  return { valid: true };
}

/**
 * Check if employee has valid user_id mapping
 */
export function hasValidUserMapping(employee: Employee): boolean {
  return employee.user_id !== null && employee.user_id !== undefined;
}

/**
 * Get employee display name for capacity calculations
 */
export function getEmployeeDisplayName(employee: Employee): string {
  return `${employee.first_name} ${employee.last_name}`.trim() || `Employee ${employee.id}`;
}
