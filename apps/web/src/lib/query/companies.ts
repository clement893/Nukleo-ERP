/**
 * React Query hooks for Companies
 * Provides cached, optimized API calls for company management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { companiesAPI, type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';

// Re-export companiesAPI for convenience
export { companiesAPI };

// Query keys for companies
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; is_client?: boolean; country?: string; search?: string }) => 
    [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
};

/**
 * Hook to fetch companies list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useCompanies(
  skip = 0,
  limit = 100,
  options?: {
    is_client?: boolean;
    country?: string;
    search?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: companyKeys.list({ skip, limit, is_client: options?.is_client, country: options?.country, search: options?.search }),
    queryFn: () => companiesAPI.list(skip, limit, {
      is_client: options?.is_client,
      country: options?.country,
      search: options?.search,
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch companies with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteCompanies(
  limit = 100,
  options?: {
    is_client?: boolean;
    country?: string;
    search?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...companyKeys.lists(), 'infinite', { limit, is_client: options?.is_client, country: options?.country, search: options?.search }],
    queryFn: ({ pageParam = 0 }) => companiesAPI.list(pageParam, limit, {
      is_client: options?.is_client,
      country: options?.country,
      search: options?.search,
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch a single company by ID
 */
export function useCompany(companyId: number, enabled = true) {
  return useQuery({
    queryKey: companyKeys.detail(companyId),
    queryFn: () => companiesAPI.get(companyId),
    enabled: enabled && !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new company
 * Automatically invalidates and refetches companies list
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyCreate) => companiesAPI.create(data),
    onSuccess: (newCompany) => {
      // Invalidate companies list to refetch
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      // Optionally add the new company to cache optimistically
      queryClient.setQueryData(companyKeys.detail(newCompany.id), newCompany);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create company:', error);
    },
  });
}

/**
 * Hook to update a company
 * Automatically updates cache and invalidates queries
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompanyUpdate }) => 
      companiesAPI.update(id, data),
    onSuccess: (updatedCompany) => {
      // Update the specific company in cache
      queryClient.setQueryData(companyKeys.detail(updatedCompany.id), updatedCompany);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update company:', error);
    },
  });
}

/**
 * Hook to delete a company
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companiesAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove company from cache
      queryClient.removeQueries({ queryKey: companyKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete company:', error);
    },
  });
}

/**
 * Hook to delete all companies
 */
export function useDeleteAllCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => companiesAPI.deleteAll(),
    onSuccess: () => {
      // Remove all companies from cache
      queryClient.removeQueries({ queryKey: companyKeys.all });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete all companies:', error);
    },
  });
}
