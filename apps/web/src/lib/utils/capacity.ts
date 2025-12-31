/**
 * Capacity Calculation Utilities
 * Helper functions for calculating employee capacity considering vacations, absences, and holidays
 */

import type { Employee } from '@/lib/api/employees';
import type { VacationRequest } from '@/lib/api/vacationRequests';

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
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  
  return holidays.some(holiday => {
    if (!holiday.is_active) return false;
    
    // Check if it's a recurring holiday (year is null) or matches the year
    if (holiday.year === null || holiday.year === year) {
      const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    }
    
    return false;
  });
}

/**
 * Check if a date is within an absence period
 */
export function isAbsence(date: Date, absences: Absence[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  return absences.some(absence => {
    // Only count approved absences
    if (absence.status !== 'approved') return false;
    
    const startDate = new Date(absence.start_date).toISOString().split('T')[0];
    const endDate = new Date(absence.end_date).toISOString().split('T')[0];
    
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
  const employeeAbsences = absences.filter(
    abs => abs.employee_id === employee.id || abs.employee_id === employee.user_id
  );
  
  // Count working days
  const workingDays = countWorkingDays(startDate, endDate, holidays, employeeAbsences);
  
  // Calculate total days in range
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  // Calculate capacity: working days * (capacity per week / 5 working days per week)
  // Assuming 5 working days per week (Monday-Friday)
  const capacityHours = workingDays * (capacityHoursPerWeek / 5);
  
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
  const startDate = new Date(weeks[0]);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday of first week
  
  const lastWeek = weeks[weeks.length - 1];
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
