/**
 * React Query hooks for Contacts
 * Provides cached, optimized API calls for contact management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { contactsAPI, type Contact, type ContactCreate, type ContactUpdate } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';

// Query keys for contacts
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; circle?: string; company_id?: number }) => 
    [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactKeys.details(), id] as const,
};

/**
 * Hook to fetch contacts list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useContacts(
  skip = 0,
  limit = 20,
  options?: {
    circle?: string;
    company_id?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: contactKeys.list({ skip, limit, circle: options?.circle, company_id: options?.company_id }),
    queryFn: () => contactsAPI.list(skip, limit),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch contacts with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteContacts(
  limit = 20,
  options?: {
    circle?: string;
    company_id?: number;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...contactKeys.lists(), 'infinite', { limit, circle: options?.circle, company_id: options?.company_id }],
    queryFn: ({ pageParam = 0 }) => contactsAPI.list(pageParam, limit),
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContact(contactId: number, enabled = true) {
  return useQuery({
    queryKey: contactKeys.detail(contactId),
    queryFn: () => contactsAPI.get(contactId),
    enabled: enabled && !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new contact
 * Automatically invalidates and refetches contacts list
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactCreate) => contactsAPI.create(data),
    onSuccess: (newContact) => {
      // Invalidate contacts list to refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      // Optionally add the new contact to cache optimistically
      queryClient.setQueryData(contactKeys.detail(newContact.id), newContact);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create contact:', error);
    },
  });
}

/**
 * Hook to update a contact
 * Automatically updates cache and invalidates queries
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) => 
      contactsAPI.update(id, data),
    onSuccess: (updatedContact) => {
      // Update the specific contact in cache
      queryClient.setQueryData(contactKeys.detail(updatedContact.id), updatedContact);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update contact:', error);
    },
  });
}

/**
 * Hook to delete a contact
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contactsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove contact from cache
      queryClient.removeQueries({ queryKey: contactKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete contact:', error);
    },
  });
}

/**
 * Hook to delete all contacts
 */
export function useDeleteAllContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => contactsAPI.deleteAll(),
    onSuccess: () => {
      // Remove all contacts from cache
      queryClient.removeQueries({ queryKey: contactKeys.all });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete all contacts:', error);
    },
  });
}
