/**
 * Timesheet Utilities
 * Helper functions for grouping and formatting time entries
 */

import type { TimeEntry } from '@/lib/api/time-entries';

export interface GroupedTimeEntry {
  key: string;
  label: string;
  entries: TimeEntry[];
  totalDuration: number;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

/**
 * Format week range as string
 */
export function formatWeekRange(date: Date): string {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/**
 * Get week key (YYYY-WW format)
 */
export function getWeekKey(date: Date): string {
  const weekStart = getWeekStart(date);
  const year = weekStart.getFullYear();
  const weekNumber = getWeekNumber(weekStart);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get week number (ISO week)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get month key (YYYY-MM format)
 */
export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format month as string
 */
export function formatMonth(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/**
 * Group time entries by week
 */
export function groupByWeek(entries: TimeEntry[]): GroupedTimeEntry[] {
  const grouped: Record<string, TimeEntry[]> = {};

  entries.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const weekKey = getWeekKey(entryDate);
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(entry);
  });

  return Object.entries(grouped)
    .map(([key, entries]) => {
      const firstEntry = entries[0];
      if (!firstEntry?.date) {
        return null;
      }
      return {
        key,
        label: formatWeekRange(new Date(firstEntry.date)),
        entries,
        totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
      };
    })
    .filter((item): item is GroupedTimeEntry => item !== null)
    .sort((a, b) => b.key.localeCompare(a.key)); // Most recent first
}

/**
 * Group time entries by month
 */
export function groupByMonth(entries: TimeEntry[]): GroupedTimeEntry[] {
  const grouped: Record<string, TimeEntry[]> = {};

  entries.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const monthKey = getMonthKey(entryDate);
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(entry);
  });

  return Object.entries(grouped)
    .map(([key, entries]) => ({
      key,
      label: formatMonth(new Date(entries[0]?.date || new Date())),
      entries,
      totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
    }))
    .sort((a, b) => b.key.localeCompare(a.key)); // Most recent first
}

/**
 * Group time entries by employee
 */
export function groupByEmployee(entries: TimeEntry[]): GroupedTimeEntry[] {
  const grouped: Record<string, TimeEntry[]> = {};

  entries.forEach((entry) => {
    const key = entry.user_id.toString();
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  });

  return Object.entries(grouped)
    .map(([key, entries]) => ({
      key,
      label: entries[0]?.user_name || entries[0]?.user_email || `Employé ${key}`,
      entries,
      totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Group time entries by project
 */
export function groupByProject(entries: TimeEntry[]): GroupedTimeEntry[] {
  const grouped: Record<string, TimeEntry[]> = {};

  entries.forEach((entry) => {
    const key = entry.project_id?.toString() || 'no-project';
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  });

  return Object.entries(grouped)
    .map(([key, entries]) => ({
      key,
      label: entries[0]?.project_name || 'Sans projet',
      entries,
      totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
    }))
    .sort((a, b) => {
      if (a.key === 'no-project') return 1;
      if (b.key === 'no-project') return -1;
      return a.label.localeCompare(b.label);
    });
}

/**
 * Group time entries by client
 */
export function groupByClient(entries: TimeEntry[]): GroupedTimeEntry[] {
  const grouped: Record<string, TimeEntry[]> = {};

  entries.forEach((entry) => {
    const key = entry.client_id?.toString() || 'no-client';
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  });

  return Object.entries(grouped)
    .map(([key, entries]) => ({
      key,
      label: entries[0]?.client_name || 'Sans client',
      entries,
      totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
    }))
    .sort((a, b) => {
      if (a.key === 'no-client') return 1;
      if (b.key === 'no-client') return -1;
      return a.label.localeCompare(b.label);
    });
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format duration to hours with decimals
 */
export function formatDurationHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(2);
}
