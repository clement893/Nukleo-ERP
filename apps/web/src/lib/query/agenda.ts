/**
 * React Query hooks for Agenda Module
 * Unified hooks for all agenda operations
 */

// Note: Agenda currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Agenda API
export { agendaAPI, agendaModuleAPI } from '../api/agenda-unified';
export type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
} from '../api/agenda-unified';

// Unified query keys for agenda module
export const agendaKeys = {
  all: ['agenda'] as const,
  events: () => [...agendaKeys.all, 'events'] as const,
  event: (id: number) => [...agendaKeys.events(), id] as const,
  eventsByDateRange: (startDate: string, endDate: string) =>
    [...agendaKeys.events(), 'date-range', startDate, endDate] as const,
};
