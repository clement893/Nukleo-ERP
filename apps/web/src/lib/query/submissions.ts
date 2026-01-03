/**
 * React Query hooks for Submissions
 * Provides cached, optimized API calls for submission management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { submissionsAPI, type SubmissionCreate, type SubmissionUpdate } from '@/lib/api/submissions';

// Re-export submissionsAPI for convenience
export { submissionsAPI };

// Query keys for submissions
export const submissionKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; company_id?: number; status?: string; type?: string }) => 
    [...submissionKeys.lists(), filters] as const,
  details: () => [...submissionKeys.all, 'detail'] as const,
  detail: (id: number) => [...submissionKeys.details(), id] as const,
};

/**
 * Hook to fetch submissions list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useSubmissions(
  skip = 0,
  limit = 100,
  options?: {
    company_id?: number;
    status?: string;
    type?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: submissionKeys.list({ skip, limit, company_id: options?.company_id, status: options?.status, type: options?.type }),
    queryFn: () => submissionsAPI.list(skip, limit, options?.company_id, options?.status, options?.type),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch submissions with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteSubmissions(
  limit = 100,
  options?: {
    company_id?: number;
    status?: string;
    type?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...submissionKeys.lists(), 'infinite', { limit, company_id: options?.company_id, status: options?.status, type: options?.type }],
    queryFn: ({ pageParam = 0 }) => submissionsAPI.list(pageParam, limit, options?.company_id, options?.status, options?.type),
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
 * Hook to fetch a single submission by ID
 */
export function useSubmission(submissionId: number, enabled = true) {
  return useQuery({
    queryKey: submissionKeys.detail(submissionId),
    queryFn: () => submissionsAPI.get(submissionId),
    enabled: enabled && !!submissionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new submission
 * Automatically invalidates and refetches submissions list
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmissionCreate) => submissionsAPI.create(data),
    onSuccess: (newSubmission) => {
      // Invalidate submissions list to refetch
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
      // Optionally add the new submission to cache optimistically
      queryClient.setQueryData(submissionKeys.detail(newSubmission.id), newSubmission);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create submission:', error);
    },
  });
}

/**
 * Hook to update a submission
 * Automatically updates cache and invalidates queries
 */
export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubmissionUpdate }) => 
      submissionsAPI.update(id, data),
    onSuccess: (updatedSubmission) => {
      // Update the specific submission in cache
      queryClient.setQueryData(submissionKeys.detail(updatedSubmission.id), updatedSubmission);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update submission:', error);
    },
  });
}

/**
 * Hook to delete a submission
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => submissionsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove submission from cache
      queryClient.removeQueries({ queryKey: submissionKeys.detail(deletedId) });
      
      // Update infinite query cache to remove the deleted submission
      queryClient.setQueriesData(
        { queryKey: submissionKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) => 
              page.filter((submission: any) => submission.id !== deletedId)
            ),
          };
        }
      );
      
      // Invalidate lists to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete submission:', error);
    },
  });
}
