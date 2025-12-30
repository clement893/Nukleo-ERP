/**
 * React Query hooks for Opportunities
 * Provides cached, optimized API calls for opportunity management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { opportunitiesAPI, type OpportunityCreate, type OpportunityUpdate } from '@/lib/api/opportunities';

// Re-export opportunitiesAPI for convenience
export { opportunitiesAPI };

// Query keys for opportunities
export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; status?: string; pipeline_id?: string; stage_id?: string; company_id?: number; search?: string }) => 
    [...opportunityKeys.lists(), filters] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: string) => [...opportunityKeys.details(), id] as const,
};

/**
 * Hook to fetch opportunities list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useOpportunities(
  skip = 0,
  limit = 100,
  options?: {
    status?: string;
    pipeline_id?: string;
    stage_id?: string;
    company_id?: number;
    search?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: opportunityKeys.list({ skip, limit, ...options }),
    queryFn: () => opportunitiesAPI.list(skip, limit, options),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch opportunities with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteOpportunities(
  limit = 100,
  options?: {
    status?: string;
    pipeline_id?: string;
    stage_id?: string;
    company_id?: number;
    search?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...opportunityKeys.lists(), 'infinite', { limit, ...options }],
    queryFn: ({ pageParam = 0 }) => opportunitiesAPI.list(pageParam, limit, options),
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
 * Hook to fetch a single opportunity by ID
 */
export function useOpportunity(opportunityId: string, enabled = true) {
  return useQuery({
    queryKey: opportunityKeys.detail(opportunityId),
    queryFn: () => opportunitiesAPI.get(opportunityId),
    enabled: enabled && !!opportunityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new opportunity
 * Automatically invalidates and refetches opportunities list
 */
export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpportunityCreate) => opportunitiesAPI.create(data),
    onSuccess: (newOpportunity) => {
      // Invalidate opportunities list to refetch
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      // Optionally add the new opportunity to cache optimistically
      queryClient.setQueryData(opportunityKeys.detail(newOpportunity.id), newOpportunity);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create opportunity:', error);
    },
  });
}

/**
 * Hook to update an opportunity
 * Automatically updates cache and invalidates queries
 */
export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OpportunityUpdate }) => 
      opportunitiesAPI.update(id, data),
    onSuccess: (updatedOpportunity) => {
      // Update the specific opportunity in cache
      queryClient.setQueryData(opportunityKeys.detail(updatedOpportunity.id), updatedOpportunity);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update opportunity:', error);
    },
  });
}

/**
 * Hook to delete an opportunity
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => opportunitiesAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove opportunity from cache
      queryClient.removeQueries({ queryKey: opportunityKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete opportunity:', error);
    },
  });
}
