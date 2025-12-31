/**
 * React Query hooks for Clients
 * Provides cached, optimized API calls for clients management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { clientsAPI, type ClientCreate, type ClientUpdate } from '@/lib/api/clients';

// Re-export clientsAPI for convenience
export { clientsAPI };

// Query keys for clients
export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; status?: string; search?: string }) => 
    [...clientsKeys.lists(), filters] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientsKeys.details(), id] as const,
  projects: (id: number) => [...clientsKeys.detail(id), 'projects'] as const,
  contacts: (id: number) => [...clientsKeys.detail(id), 'contacts'] as const,
};

/**
 * Hook to fetch clients list with pagination
 */
export function useClients(
  skip = 0,
  limit = 20,
  filters?: { status?: string; search?: string },
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: clientsKeys.list({ skip, limit, ...filters }),
    queryFn: () => {
      const skipNum = Number(skip);
      const limitNum = Number(limit);
      console.log('[useClients] queryFn called:', {
        skip: { original: skip, type: typeof skip, converted: skipNum },
        limit: { original: limit, type: typeof limit, converted: limitNum },
        filters,
      });
      return clientsAPI.list(skipNum, limitNum, filters);
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch clients with infinite scroll
 */
export function useInfiniteClients(
  limit = 20,
  filters?: { status?: string; search?: string },
  options?: {
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...clientsKeys.lists(), 'infinite', { limit, ...filters }],
    queryFn: ({ pageParam = 0 }) => {
      const skipNum = Number(pageParam);
      const limitNum = Number(limit);
      console.log('[useInfiniteClients] queryFn called:', {
        pageParam: { original: pageParam, type: typeof pageParam, converted: skipNum },
        limit: { original: limit, type: typeof limit, converted: limitNum },
        filters,
      });
      return clientsAPI.list(skipNum, limitNum, filters);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) {
        return undefined;
      }
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(clientId: number, enabled = true) {
  return useQuery({
    queryKey: clientsKeys.detail(clientId),
    queryFn: () => clientsAPI.get(clientId),
    enabled: enabled && !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientCreate) => clientsAPI.create(data),
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      queryClient.setQueryData(clientsKeys.detail(newClient.id), newClient);
    },
  });
}

/**
 * Hook to update a client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientUpdate }) => 
      clientsAPI.update(id, data),
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      queryClient.setQueryData(clientsKeys.detail(updatedClient.id), updatedClient);
    },
  });
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      queryClient.removeQueries({ queryKey: clientsKeys.detail(deletedId) });
    },
  });
}

/**
 * Hook to fetch projects for a client
 */
export function useClientProjects(clientId: number, enabled = true) {
  return useQuery({
    queryKey: clientsKeys.projects(clientId),
    queryFn: () => clientsAPI.getProjects(clientId),
    enabled: enabled && !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch contacts for a client
 */
export function useClientContacts(clientId: number, enabled = true) {
  return useQuery({
    queryKey: clientsKeys.contacts(clientId),
    queryFn: () => clientsAPI.getContacts(clientId),
    enabled: enabled && !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
