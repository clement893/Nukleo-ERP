/**
 * Clients Query Hooks
 * React Query hooks for project clients
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { clientsAPI, ClientCreate, ClientUpdate, ClientStatus } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';

const QUERY_KEY = 'clients';

/**
 * Hook to fetch clients with infinite scroll
 */
export function useInfiniteClients(pageSize = 20, filters?: {
  status?: ClientStatus;
  responsible_id?: number;
  search?: string;
}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEY, 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Ensure pageParam and pageSize are valid integers
      const skip = Math.max(0, Math.floor(Number(pageParam)) || 0);
      const limit = Math.max(1, Math.min(Math.floor(Number(pageSize)) || 20, 1000));
      
      return await clientsAPI.list(
        skip,
        limit,
        filters?.status,
        filters?.responsible_id,
        filters?.search
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = Math.max(1, Math.min(Math.floor(Number(pageSize)) || 20, 1000));
      if (lastPage.length < limit) {
        return undefined;
      }
      return allPages.length * limit;
    },
    initialPageParam: 0,
  });
}

/**
 * Hook to fetch a single client
 */
export function useClient(clientId: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, clientId],
    queryFn: () => {
      if (!clientId) throw new Error('Client ID is required');
      return clientsAPI.get(clientId);
    },
    enabled: !!clientId,
  });
}

/**
 * Hook to create a client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (client: ClientCreate) => clientsAPI.create(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

/**
 * Hook to update a client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: number; data: ClientUpdate }) =>
      clientsAPI.update(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.clientId] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: number) => clientsAPI.delete(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

/**
 * Hook to import clients
 */
export function useImportClients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, importId }: { file: File; importId?: string }) =>
      clientsAPI.import(file, importId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

/**
 * Hook to export clients
 */
export function useExportClients() {
  return useMutation({
    mutationFn: () => clientsAPI.export(),
    onError: (error) => {
      handleApiError(error);
    },
  });
}
