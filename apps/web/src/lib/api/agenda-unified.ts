/**
 * Agenda Module API
 * Unified API client for agenda operations
 * 
 * This module provides a unified interface for all agenda operations:
 * - Events
 */

// Import Agenda API
import {
  agendaAPI,
  type CalendarEvent,
  type CalendarEventCreate,
  type CalendarEventUpdate,
} from './agenda';

// Re-export types
export type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
};

// Re-export API
export { agendaAPI };

// Alias for convenience
export const agendaModuleAPI = agendaAPI;
