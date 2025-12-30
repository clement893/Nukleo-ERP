/**
 * React Query hooks for Quotes
 * Provides cached, optimized API calls for quote management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { quotesAPI, type QuoteCreate, type QuoteUpdate } from '@/lib/api/quotes';

// Re-export quotesAPI for convenience
export { quotesAPI };

// Query keys for quotes
export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; company_id?: number; status?: string }) => 
    [...quoteKeys.lists(), filters] as const,
  details: () => [...quoteKeys.all, 'detail'] as const,
  detail: (id: number) => [...quoteKeys.details(), id] as const,
};

/**
 * Hook to fetch quotes list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useQuotes(
  skip = 0,
  limit = 100,
  options?: {
    company_id?: number;
    status?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: quoteKeys.list({ skip, limit, company_id: options?.company_id, status: options?.status }),
    queryFn: () => quotesAPI.list(skip, limit, options?.company_id, options?.status),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch quotes with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteQuotes(
  limit = 100,
  options?: {
    company_id?: number;
    status?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...quoteKeys.lists(), 'infinite', { limit, company_id: options?.company_id, status: options?.status }],
    queryFn: ({ pageParam = 0 }) => quotesAPI.list(pageParam, limit, options?.company_id, options?.status),
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
 * Hook to fetch a single quote by ID
 */
export function useQuote(quoteId: number, enabled = true) {
  return useQuery({
    queryKey: quoteKeys.detail(quoteId),
    queryFn: () => quotesAPI.get(quoteId),
    enabled: enabled && !!quoteId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new quote
 * Automatically invalidates and refetches quotes list
 */
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuoteCreate) => quotesAPI.create(data),
    onSuccess: (newQuote) => {
      // Invalidate quotes list to refetch
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      // Optionally add the new quote to cache optimistically
      queryClient.setQueryData(quoteKeys.detail(newQuote.id), newQuote);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create quote:', error);
    },
  });
}

/**
 * Hook to update a quote
 * Automatically updates cache and invalidates queries
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuoteUpdate }) => 
      quotesAPI.update(id, data),
    onSuccess: (updatedQuote) => {
      // Update the specific quote in cache
      queryClient.setQueryData(quoteKeys.detail(updatedQuote.id), updatedQuote);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update quote:', error);
    },
  });
}

/**
 * Hook to delete a quote
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quotesAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove quote from cache
      queryClient.removeQueries({ queryKey: quoteKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete quote:', error);
    },
  });
}
