/**
 * React Query hooks for People
 * Provides cached, optimized API calls for people management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { peopleAPI, type PeopleCreate, type PeopleUpdate } from '@/lib/api/people';

// Re-export peopleAPI for convenience
export { peopleAPI };

// Query keys for people
export const peopleKeys = {
  all: ['people'] as const,
  lists: () => [...peopleKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; status?: string; search?: string }) => 
    [...peopleKeys.lists(), filters] as const,
  details: () => [...peopleKeys.all, 'detail'] as const,
  detail: (id: number) => [...peopleKeys.details(), id] as const,
  projects: (id: number) => [...peopleKeys.detail(id), 'projects'] as const,
  contacts: (id: number) => [...peopleKeys.detail(id), 'contacts'] as const,
};

/**
 * Hook to fetch people list with pagination
 */
export function usePeople(
  skip = 0,
  limit = 20,
  filters?: { status?: string; search?: string },
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: peopleKeys.list({ skip, limit, ...filters }),
    queryFn: () => peopleAPI.list(Number(skip), Number(limit), filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch people with infinite scroll
 */
export function useInfinitePeople(
  limit = 20,
  filters?: { status?: string; search?: string },
  options?: {
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...peopleKeys.lists(), 'infinite', { limit, ...filters }],
    queryFn: ({ pageParam = 0 }) => peopleAPI.list(Number(pageParam), Number(limit), filters),
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
 * Hook to fetch a single person by ID
 */
export function usePerson(peopleId: number, enabled = true) {
  return useQuery({
    queryKey: peopleKeys.detail(peopleId),
    queryFn: () => peopleAPI.get(peopleId),
    enabled: enabled && !!peopleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new person
 */
export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PeopleCreate) => peopleAPI.create(data),
    onSuccess: (newPerson) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
      queryClient.setQueryData(peopleKeys.detail(newPerson.id), newPerson);
    },
  });
}

/**
 * Hook to update a person
 */
export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PeopleUpdate }) => 
      peopleAPI.update(id, data),
    onSuccess: (updatedPerson) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
      queryClient.setQueryData(peopleKeys.detail(updatedPerson.id), updatedPerson);
    },
  });
}

/**
 * Hook to delete a person
 */
export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => peopleAPI.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
      queryClient.removeQueries({ queryKey: peopleKeys.detail(deletedId) });
    },
  });
}

/**
 * Hook to fetch projects for a person
 */
export function usePersonProjects(peopleId: number, enabled = true) {
  return useQuery({
    queryKey: peopleKeys.projects(peopleId),
    queryFn: () => peopleAPI.getProjects(peopleId),
    enabled: enabled && !!peopleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch contacts for a person
 */
export function usePersonContacts(peopleId: number, enabled = true) {
  return useQuery({
    queryKey: peopleKeys.contacts(peopleId),
    queryFn: () => peopleAPI.getContacts(peopleId),
    enabled: enabled && !!peopleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
