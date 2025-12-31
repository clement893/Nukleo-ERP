/**
 * Capacity Calculation Utilities
 * Helper functions for calculating employee capacity considering vacations, absences, and holidays
 */

import type { Employee } from '@/lib/api/employees';

export interface PublicHoliday {
  id: number;
  name: string;
  date: string; // ISO date string
  year?: number | null;
  is_active: boolean;
}

export interface Absence {
  id: number;
  employee_id: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  type: 'vacation' | 'sick_leave' | 'personal_leave' | 'other';
  status: 'approved' | 'pending' | 'rejected';
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is a public holiday
 */
export function isPublicHoliday(date: Date, holidays: PublicHoliday[]): boolean {
  if (holidays.length === 0) return false;
  
  // Normalize date to UTC midnight for comparison
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  
  return holidays.some(holiday => {
    if (!holiday.is_active) return false;
    if (!holiday.date) return false;
    
    // Check if it's a recurring holiday (year is null) or matches the year
    if (holiday.year === null || holiday.year === year) {
      // Normalize holiday date to UTC
      const holidayDate = new Date(holiday.date + 'T00:00:00Z').toISOString().split('T')[0];
      return holidayDate === dateStr;
    }
    
    return false;
  });
}

/**
 * Check if a date is within an absence period
 */
export function isAbsence(date: Date, absences: Absence[]): boolean {
  if (absences.length === 0) return false;
  
  // Normalize date to UTC midnight for comparison
  const dateStr = date.toISOString().split('T')[0];
  if (!dateStr) return false;
  
  return absences.some(absence => {
    // Only count approved absences
    if (absence.status !== 'approved') return false;
    
    // Validate date range
    if (!absence.start_date || !absence.end_date) return false;
    
    const startDate = new Date(absence.start_date + 'T00:00:00Z').toISOString().split('T')[0];
    const endDate = new Date(absence.end_date + 'T23:59:59Z').toISOString().split('T')[0];
    
    if (!startDate || !endDate) return false;
    
    // Validate that start_date <= end_date
    if (startDate > endDate) {
      console.warn(`Invalid absence date range: ${startDate} > ${endDate}`);
      return false;
    }
    
    return dateStr >= startDate && dateStr <= endDate;
  });
}

/**
 * Check if a date is a working day (not weekend, not holiday, not absence)
 */
export function isWorkingDay(
  date: Date,
  holidays: PublicHoliday[],
  absences: Absence[]
): boolean {
  if (isWeekend(date)) return false;
  if (isPublicHoliday(date, holidays)) return false;
  if (isAbsence(date, absences)) return false;
  return true;
}

/**
 * Count working days in a date range
 */
export function countWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: PublicHoliday[],
  absences: Absence[]
): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current, holidays, absences)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculate available capacity for an employee in a date range
 * Takes into account:
 * - Base capacity per week
 * - Weekends
 * - Public holidays
 * - Approved vacations/absences
 */
export function calculateAvailableCapacity(
  employee: Employee,
  startDate: Date,
  endDate: Date,
  holidays: PublicHoliday[] = [],
  absences: Absence[] = []
): {
  totalDays: number;
  workingDays: number;
  capacityHours: number;
  capacityHoursPerWeek: number;
} {
  const capacityHoursPerWeek = employee.capacity_hours_per_week || 35;
  
  // Filter absences for this employee
  // Note: absences use employee_id (employees.id), not user_id
  const employeeAbsences = absences.filter(
    abs => abs.employee_id === employee.id
  );
  
  // Count working days
  const workingDays = countWorkingDays(startDate, endDate, holidays, employeeAbsences);
  
  // Calculate total days in range
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  // Calculate capacity more accurately by week
  // Instead of assuming 5 days/week, calculate actual working days per week
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Group working days by week
  let totalCapacityHours = 0;
  let current = new Date(start);
  let iterations = 0;
  const maxIterations = 1000; // Safety limit (max ~19 years)
  
  while (current <= end && iterations < maxIterations) {
    iterations++;
    
    // Get Monday of current week
    const weekStart = new Date(current);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
    weekStart.setDate(weekStart.getDate() + diff);
    
    // Get Sunday of current week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Ensure we don't go beyond end date
    const actualWeekEnd = weekEnd > end ? new Date(end.getTime()) : new Date(weekEnd.getTime());
    const actualWeekStart = weekStart < start ? new Date(start.getTime()) : new Date(weekStart.getTime());
    
    // Count working days in this week
    const weekWorkingDays = countWorkingDays(actualWeekStart, actualWeekEnd, holidays, employeeAbsences);
    
    // Calculate capacity for this week: (working days / 5) * capacity per week
    // This handles weeks with holidays correctly
    // If a week has 0 working days (all holidays/vacations), capacity is 0
    const weekCapacity = weekWorkingDays > 0 
      ? (weekWorkingDays / 5) * capacityHoursPerWeek 
      : 0;
    totalCapacityHours += weekCapacity;
    
    // Move to next week (Monday of next week)
    // Use actualWeekEnd to ensure we don't skip weeks
    current = new Date(actualWeekEnd);
    current.setDate(current.getDate() + 1);
    
    // Safety check: if we didn't advance, force advance by 7 days
    if (current.getTime() <= weekStart.getTime()) {
      current.setDate(current.getDate() + 7);
    }
  }
  
  if (iterations >= maxIterations) {
    console.warn(`Capacity calculation exceeded max iterations for period ${startDate} to ${endDate}`);
  }
  
  const capacityHours = totalCapacityHours;
  
  return {
    totalDays,
    workingDays,
    capacityHours,
    capacityHoursPerWeek,
  };
}

/**
 * Calculate capacity for multiple weeks
 */
export function calculateWeeklyCapacity(
  employee: Employee,
  weeks: Date[],
  holidays: PublicHoliday[] = [],
  absences: Absence[] = []
): {
  totalWeeks: number;
  totalWorkingDays: number;
  totalCapacityHours: number;
  capacityHoursPerWeek: number;
} {
  if (weeks.length === 0) {
    return {
      totalWeeks: 0,
      totalWorkingDays: 0,
      totalCapacityHours: 0,
      capacityHoursPerWeek: employee.capacity_hours_per_week || 35,
    };
  }
  
  // Get start and end dates from weeks
  if (weeks.length === 0) {
    return {
      totalWeeks: 0,
      totalWorkingDays: 0,
      totalCapacityHours: 0,
      capacityHoursPerWeek: employee.capacity_hours_per_week || 35,
    };
  }
  
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];
  if (!firstWeek || !lastWeek) {
    return {
      totalWeeks: 0,
      totalWorkingDays: 0,
      totalCapacityHours: 0,
      capacityHoursPerWeek: employee.capacity_hours_per_week || 35,
    };
  }
  
  const startDate = new Date(firstWeek);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday of first week
  
  const endDate = new Date(lastWeek);
  endDate.setDate(endDate.getDate() - endDate.getDay() + 7); // Sunday of last week
  
  const capacity = calculateAvailableCapacity(employee, startDate, endDate, holidays, absences);
  
  return {
    totalWeeks: weeks.length,
    totalWorkingDays: capacity.workingDays,
    totalCapacityHours: capacity.capacityHours,
    capacityHoursPerWeek: capacity.capacityHoursPerWeek,
  };
}
