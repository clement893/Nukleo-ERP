/**
 * Optimized Capacity Calculation Utilities
 * Alternative optimized implementations for very long periods
 */

import type { Employee } from '@/lib/api/employees';
import type { PublicHoliday, Absence } from './capacity';

/**
 * Optimized count working days using mathematical approach
 * For periods > 3 months, this is faster than day-by-day iteration
 */
export function countWorkingDaysOptimized(
  startDate: Date,
  endDate: Date,
  holidays: PublicHoliday[] = [],
  absences: Absence[] = []
): number {
  if (startDate > endDate) return 0;
  
  // Calculate total days
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Count weekends (approximately)
  const weeks = Math.floor(totalDays / 7);
  const weekendDays = weeks * 2;
  const remainingDays = totalDays % 7;
  
  // Adjust for partial week weekends
  const startDay = startDate.getDay();
  for (let i = 0; i < remainingDays; i++) {
    const dayOfWeek = (startDay + i) % 7;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    }
  }
  
  // Subtract holidays and absences
  const holidaySet = new Set<string>();
  const year = startDate.getFullYear();
  holidays.forEach(h => {
    if (h.is_active && h.date && (h.year === null || h.year === year)) {
      const date = new Date(h.date + 'T00:00:00Z').toISOString().split('T')[0];
      if (date) holidaySet.add(date);
    }
  });
  
  const absenceSet = new Set<string>();
  absences.forEach(a => {
    if (a.status === 'approved' && a.start_date && a.end_date) {
      const start = new Date(a.start_date + 'T00:00:00Z');
      const end = new Date(a.end_date + 'T23:59:59Z');
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        if (dateStr) absenceSet.add(dateStr);
        current.setDate(current.getDate() + 1);
      }
    }
  });
  
  // Count holidays and absences that fall on weekdays
  let excludedDays = 0;
  const checkDate = new Date(startDate);
  while (checkDate <= endDate) {
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateStr && (holidaySet.has(dateStr) || absenceSet.has(dateStr))) {
        excludedDays++;
      }
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  return totalDays - weekendDays - excludedDays;
}

/**
 * Calculate capacity with automatic optimization based on period length
 */
export function calculateAvailableCapacityOptimized(
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
  const employeeAbsences = absences.filter(abs => abs.employee_id === employee.id);
  
  // Use optimized version for periods > 90 days
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const workingDays = daysDiff > 90
    ? countWorkingDaysOptimized(startDate, endDate, holidays, employeeAbsences)
    : countWorkingDays(startDate, endDate, holidays, employeeAbsences);
  
  const totalDays = daysDiff + 1;
  
  // Calculate capacity by week (same as before)
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let totalCapacityHours = 0;
  let current = new Date(start);
  let iterations = 0;
  const maxIterations = 1000;
  
  while (current <= end && iterations < maxIterations) {
    iterations++;
    
    const weekStart = new Date(current);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const actualWeekEnd = weekEnd > end ? new Date(end.getTime()) : new Date(weekEnd.getTime());
    const actualWeekStart = weekStart < start ? new Date(start.getTime()) : new Date(weekStart.getTime());
    
    const weekWorkingDays = daysDiff > 90
      ? countWorkingDaysOptimized(actualWeekStart, actualWeekEnd, holidays, employeeAbsences)
      : countWorkingDays(actualWeekStart, actualWeekEnd, holidays, employeeAbsences);
    
    const weekCapacity = weekWorkingDays > 0 
      ? (weekWorkingDays / 5) * capacityHoursPerWeek 
      : 0;
    totalCapacityHours += weekCapacity;
    
    current = new Date(actualWeekEnd);
    current.setDate(current.getDate() + 1);
    
    if (current.getTime() <= weekStart.getTime()) {
      current.setDate(current.getDate() + 7);
    }
  }
  
  return {
    totalDays,
    workingDays,
    capacityHours: totalCapacityHours,
    capacityHoursPerWeek,
  };
}
