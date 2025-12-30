/**
 * React Query hooks for Réseau Contacts
 * Provides cached, optimized API calls for network module contact management
 * 
 * Uses separate cache keys from commercial contacts to avoid conflicts
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { reseauContactsAPI, type ContactCreate, type ContactUpdate } from '@/lib/api/reseau-contacts';

// Re-export reseauContactsAPI for convenience
export { reseauContactsAPI };

// Query keys for réseau contacts - separate from commercial contacts
export const reseauContactKeys = {
  all: ['reseau-contacts'] as const,
  lists: () => [...reseauContactKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; circle?: string; company_id?: number }) => 
    [...reseauContactKeys.lists(), filters] as const,
  details: () => [...reseauContactKeys.all, 'detail'] as const,
  detail: (id: number) => [...reseauContactKeys.details(), id] as const,
};

/**
 * Hook to fetch contacts list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useReseauContacts(
  skip = 0,
  limit = 20,
  options?: {
    circle?: string;
    company_id?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: reseauContactKeys.list({ skip, limit, circle: options?.circle, company_id: options?.company_id }),
    queryFn: () => reseauContactsAPI.list(skip, limit),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch contacts with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteReseauContacts(
  limit = 20,
  options?: {
    circle?: string;
    company_id?: number;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...reseauContactKeys.lists(), 'infinite', { limit, circle: options?.circle, company_id: options?.company_id }],
    queryFn: ({ pageParam = 0 }) => reseauContactsAPI.list(pageParam, limit),
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
export function useReseauContact(contactId: number, enabled = true) {
  return useQuery({
    queryKey: reseauContactKeys.detail(contactId),
    queryFn: () => reseauContactsAPI.get(contactId),
    enabled: enabled && !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new contact
 * Automatically invalidates and refetches contacts list
 */
export function useCreateReseauContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactCreate) => reseauContactsAPI.create(data),
    onSuccess: (newContact) => {
      // Invalidate réseau contacts list to refetch
      queryClient.invalidateQueries({ queryKey: reseauContactKeys.lists() });
      // Optionally add the new contact to cache optimistically
      queryClient.setQueryData(reseauContactKeys.detail(newContact.id), newContact);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create réseau contact:', error);
    },
  });
}

/**
 * Hook to update a contact
 * Automatically updates cache and invalidates queries
 */
export function useUpdateReseauContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) => 
      reseauContactsAPI.update(id, data),
    onSuccess: (updatedContact) => {
      // Update the specific contact in cache
      queryClient.setQueryData(reseauContactKeys.detail(updatedContact.id), updatedContact);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: reseauContactKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update réseau contact:', error);
    },
  });
}

/**
 * Hook to delete a contact
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteReseauContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reseauContactsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove contact from cache
      queryClient.removeQueries({ queryKey: reseauContactKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: reseauContactKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete réseau contact:', error);
    },
  });
}

/**
 * Hook to delete all contacts
 */
export function useDeleteAllReseauContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reseauContactsAPI.deleteAll(),
    onSuccess: () => {
      // Remove all contacts from cache
      queryClient.removeQueries({ queryKey: reseauContactKeys.all });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: reseauContactKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete all réseau contacts:', error);
    },
  });
}
