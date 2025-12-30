/**
 * React Query hooks for Réseau Testimonials
 * Provides cached, optimized API calls for network module testimonial management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { reseauTestimonialsAPI, type TestimonialCreate, type TestimonialUpdate } from '@/lib/api/reseau-testimonials';

// Re-export reseauTestimonialsAPI for convenience
export { reseauTestimonialsAPI };

// Query keys for réseau testimonials
export const reseauTestimonialKeys = {
  all: ['reseau-testimonials'] as const,
  lists: () => [...reseauTestimonialKeys.all, 'list'] as const,
  list: (filters?: {
    skip?: number;
    limit?: number;
    company_id?: number;
    contact_id?: number;
    language?: string;
    is_published?: string;
    search?: string;
  }) => [...reseauTestimonialKeys.lists(), filters] as const,
  details: () => [...reseauTestimonialKeys.all, 'detail'] as const,
  detail: (id: number) => [...reseauTestimonialKeys.details(), id] as const,
};

/**
 * Hook to fetch testimonials list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useReseauTestimonials(
  skip = 0,
  limit = 20,
  options?: {
    company_id?: number;
    contact_id?: number;
    language?: string;
    is_published?: string;
    search?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: reseauTestimonialKeys.list({
      skip,
      limit,
      company_id: options?.company_id,
      contact_id: options?.contact_id,
      language: options?.language,
      is_published: options?.is_published,
      search: options?.search,
    }),
    queryFn: () =>
      reseauTestimonialsAPI.list(skip, limit, {
        company_id: options?.company_id,
        contact_id: options?.contact_id,
        language: options?.language,
        is_published: options?.is_published,
        search: options?.search,
      }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch testimonials with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteReseauTestimonials(
  limit = 20,
  options?: {
    company_id?: number;
    contact_id?: number;
    language?: string;
    is_published?: string;
    search?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [
      ...reseauTestimonialKeys.lists(),
      'infinite',
      {
        limit,
        company_id: options?.company_id,
        contact_id: options?.contact_id,
        language: options?.language,
        is_published: options?.is_published,
        search: options?.search,
      },
    ],
    queryFn: ({ pageParam = 0 }) =>
      reseauTestimonialsAPI.list(pageParam, limit, {
        company_id: options?.company_id,
        contact_id: options?.contact_id,
        language: options?.language,
        is_published: options?.is_published,
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
 * Hook to fetch a single testimonial by ID
 */
export function useReseauTestimonial(testimonialId: number, enabled = true) {
  return useQuery({
    queryKey: reseauTestimonialKeys.detail(testimonialId),
    queryFn: () => reseauTestimonialsAPI.get(testimonialId),
    enabled: enabled && !!testimonialId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new testimonial
 * Automatically invalidates and refetches testimonials list
 */
export function useCreateReseauTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TestimonialCreate) => reseauTestimonialsAPI.create(data),
    onSuccess: (newTestimonial) => {
      // Invalidate réseau testimonials list to refetch
      queryClient.invalidateQueries({ queryKey: reseauTestimonialKeys.lists() });
      // Optionally add the new testimonial to cache optimistically
      queryClient.setQueryData(reseauTestimonialKeys.detail(newTestimonial.id), newTestimonial);
    },
    onError: (error) => {
      console.error('Failed to create réseau testimonial:', error);
    },
  });
}

/**
 * Hook to update a testimonial
 * Automatically updates cache and invalidates queries
 */
export function useUpdateReseauTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TestimonialUpdate }) =>
      reseauTestimonialsAPI.update(id, data),
    onSuccess: (updatedTestimonial) => {
      // Update the specific testimonial in cache
      queryClient.setQueryData(reseauTestimonialKeys.detail(updatedTestimonial.id), updatedTestimonial);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: reseauTestimonialKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update réseau testimonial:', error);
    },
  });
}

/**
 * Hook to delete a testimonial
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteReseauTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reseauTestimonialsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove testimonial from cache
      queryClient.removeQueries({ queryKey: reseauTestimonialKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: reseauTestimonialKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete réseau testimonial:', error);
    },
  });
}

/**
 * Hook to delete all testimonials
 */
export function useDeleteAllReseauTestimonials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reseauTestimonialsAPI.deleteAll(),
    onSuccess: () => {
      // Remove all testimonials from cache
      queryClient.removeQueries({ queryKey: reseauTestimonialKeys.all });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: reseauTestimonialKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete all réseau testimonials:', error);
    },
  });
}
