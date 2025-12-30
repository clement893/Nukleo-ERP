/**
 * React Query hooks for Projects
 * Provides cached, optimized API calls for project management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { projectsAPI, type ProjectCreate, type ProjectUpdate } from '@/lib/api/projects';

// Re-export projectsAPI for convenience
export { projectsAPI };

// Query keys for projects
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number; status?: string }) => 
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

/**
 * Hook to fetch projects list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useProjects(
  skip = 0,
  limit = 20,
  options?: {
    status?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: projectKeys.list({ skip, limit, status: options?.status }),
    queryFn: () => projectsAPI.list(skip, limit),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
  });
}

/**
 * Hook to fetch projects with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteProjects(
  limit = 20,
  options?: {
    status?: string;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...projectKeys.lists(), 'infinite', { limit, status: options?.status }],
    queryFn: ({ pageParam = 0 }) => projectsAPI.list(pageParam, limit),
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
 * Hook to fetch a single project by ID
 */
export function useProject(projectId: number, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsAPI.get(projectId),
    enabled: enabled && !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new project
 * Automatically invalidates and refetches projects list
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsAPI.create(data),
    onSuccess: (newProject) => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Optionally add the new project to cache optimistically
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
    },
    onError: (error) => {
      // Error handling is done by the component using the hook
      console.error('Failed to create project:', error);
    },
  });
}

/**
 * Hook to update a project
 * Automatically updates cache and invalidates queries
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectUpdate }) => 
      projectsAPI.update(id, data),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
    },
  });
}

/**
 * Hook to delete a project
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
    },
  });
}

/**
 * Hook to delete all projects
 */
export function useDeleteAllProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectsAPI.deleteAll(),
    onSuccess: () => {
      // Remove all projects from cache
      queryClient.removeQueries({ queryKey: projectKeys.all });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete all projects:', error);
    },
  });
}
