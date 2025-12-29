/**
 * Agenda API
 * API client for calendar events endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  date: string; // ISO date string
  end_date?: string; // ISO date string
  time?: string; // HH:MM format
  type: 'meeting' | 'appointment' | 'reminder' | 'deadline' | 'vacation' | 'holiday' | 'other';
  location?: string;
  attendees?: string[];
  color?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  end_date?: string; // ISO date string (YYYY-MM-DD)
  time?: string; // HH:MM format
  type?: 'meeting' | 'appointment' | 'reminder' | 'deadline' | 'vacation' | 'holiday' | 'other';
  location?: string;
  attendees?: string[];
  color?: string;
}

export interface CalendarEventUpdate extends Partial<CalendarEventCreate> {}

/**
 * Agenda API client
 */
export const agendaAPI = {
  /**
   * Get list of calendar events
   */
  list: async (params?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    skip?: number;
    limit?: number;
  }): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>('/v1/agenda/events', {
      params,
    });
    
    const data = extractApiData<CalendarEvent[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a calendar event by ID
   */
  get: async (eventId: number): Promise<CalendarEvent> => {
    const response = await apiClient.get<CalendarEvent>(`/v1/agenda/events/${eventId}`);
    const data = extractApiData<CalendarEvent>(response);
    if (!data) {
      throw new Error(`Event not found: ${eventId}`);
    }
    return data;
  },

  /**
   * Create a new calendar event
   */
  create: async (event: CalendarEventCreate): Promise<CalendarEvent> => {
    const response = await apiClient.post<CalendarEvent>('/v1/agenda/events', event);
    const data = extractApiData<CalendarEvent>(response);
    if (!data) {
      throw new Error('Failed to create event: no data returned');
    }
    return data;
  },

  /**
   * Update a calendar event
   */
  update: async (eventId: number, event: CalendarEventUpdate): Promise<CalendarEvent> => {
    const response = await apiClient.put<CalendarEvent>(`/v1/agenda/events/${eventId}`, event);
    const data = extractApiData<CalendarEvent>(response);
    if (!data) {
      throw new Error('Failed to update event: no data returned');
    }
    return data;
  },

  /**
   * Delete a calendar event
   */
  delete: async (eventId: number): Promise<void> => {
    await apiClient.delete(`/v1/agenda/events/${eventId}`);
  },
};
