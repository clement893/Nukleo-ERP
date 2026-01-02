/**
 * React Query hooks for Agenda Events
 * Provides cached, optimized API calls for calendar event management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { agendaAPI, type CalendarEventCreate, type CalendarEventUpdate } from '@/lib/api/agenda';

// Re-export agendaAPI for convenience
export { agendaAPI };

// Query keys for agenda events
export const agendaEventKeys = {
  all: ['agenda-events'] as const,
  lists: () => [...agendaEventKeys.all, 'list'] as const,
  list: (filters?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    skip?: number;
    limit?: number;
  }) => [...agendaEventKeys.lists(), filters] as const,
  details: () => [...agendaEventKeys.all, 'detail'] as const,
  detail: (id: number) => [...agendaEventKeys.details(), id] as const,
};

/**
 * Hook to fetch events list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useEvents(
  options?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    skip?: number;
    limit?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: agendaEventKeys.list({
      start_date: options?.start_date,
      end_date: options?.end_date,
      event_type: options?.event_type,
      skip: options?.skip,
      limit: options?.limit,
    }),
    queryFn: () => agendaAPI.list({
      start_date: options?.start_date,
      end_date: options?.end_date,
      event_type: options?.event_type,
      skip: options?.skip,
      limit: options?.limit,
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes - events change frequently
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch events with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteEvents(
  limit = 50,
  options?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...agendaEventKeys.lists(), 'infinite', { limit, ...options }],
    queryFn: ({ pageParam = 0 }) => agendaAPI.list({
      skip: pageParam,
      limit,
      start_date: options?.start_date,
      end_date: options?.end_date,
      event_type: options?.event_type,
    }),
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than limit, we've reached the end
      if (lastPage.length < limit) {
        return undefined;
      }
      // Return next skip value
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single event by ID
 */
export function useEvent(eventId: number, enabled = true) {
  return useQuery({
    queryKey: agendaEventKeys.detail(eventId),
    queryFn: () => agendaAPI.get(eventId),
    enabled: enabled && !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new event
 * Automatically invalidates and refetches events list
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CalendarEventCreate) => agendaAPI.create(data),
    onSuccess: (newEvent) => {
      // Invalidate events list to refetch
      queryClient.invalidateQueries({ queryKey: agendaEventKeys.lists() });
      // Optionally add the new event to cache optimistically
      queryClient.setQueryData(agendaEventKeys.detail(newEvent.id), newEvent);
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
    },
  });
}

/**
 * Hook to update an event
 * Automatically updates cache and invalidates queries
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CalendarEventUpdate }) =>
      agendaAPI.update(id, data),
    onSuccess: (updatedEvent) => {
      // Update the specific event in cache
      queryClient.setQueryData(agendaEventKeys.detail(updatedEvent.id), updatedEvent);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: agendaEventKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update event:', error);
    },
  });
}

/**
 * Hook to delete an event
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => agendaAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove event from cache
      queryClient.removeQueries({ queryKey: agendaEventKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: agendaEventKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete event:', error);
    },
  });
}
