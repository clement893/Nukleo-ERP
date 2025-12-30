/**
 * Agenda Module API
 * Unified API client for agenda operations
 * 
 * This module provides a unified interface for all agenda operations:
 * - Events
 */

// Re-export Agenda API as unified interface
export {
  agendaAPI,
  type CalendarEvent,
  type CalendarEventCreate,
  type CalendarEventUpdate,
} from './agenda';

// Alias for convenience
export const agendaModuleAPI = agendaAPI;
