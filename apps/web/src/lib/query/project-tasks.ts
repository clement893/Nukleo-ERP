/**
 * React Query hooks for Project Tasks
 * Provides cached, optimized API calls for project task management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { projectTasksAPI, type ProjectTaskCreate, type ProjectTaskUpdate, type TaskStatus } from '@/lib/api/project-tasks';

// Re-export projectTasksAPI for convenience
export { projectTasksAPI };

// Query keys for project tasks
export const projectTaskKeys = {
  all: ['project-tasks'] as const,
  lists: () => [...projectTaskKeys.all, 'list'] as const,
  list: (filters?: {
    team_id?: number;
    project_id?: number;
    assignee_id?: number;
    status?: TaskStatus;
    skip?: number;
    limit?: number;
  }) => [...projectTaskKeys.lists(), filters] as const,
  details: () => [...projectTaskKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectTaskKeys.details(), id] as const,
};

/**
 * Hook to fetch tasks list with pagination
 * Uses React Query cache to avoid unnecessary requests
 */
export function useProjectTasks(
  options?: {
    team_id?: number;
    project_id?: number;
    assignee_id?: number;
    status?: TaskStatus;
    skip?: number;
    limit?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: projectTaskKeys.list({
      team_id: options?.team_id,
      project_id: options?.project_id,
      assignee_id: options?.assignee_id,
      status: options?.status,
      skip: options?.skip,
      limit: options?.limit,
    }),
    queryFn: () => projectTasksAPI.list({
      team_id: options?.team_id,
      project_id: options?.project_id,
      assignee_id: options?.assignee_id,
      status: options?.status,
      skip: options?.skip,
      limit: options?.limit,
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes - tasks change frequently
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch tasks with infinite scroll
 * Automatically handles pagination and caching
 */
export function useInfiniteProjectTasks(
  limit = 50,
  options?: {
    team_id?: number;
    project_id?: number;
    assignee_id?: number;
    status?: TaskStatus;
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...projectTaskKeys.lists(), 'infinite', { limit, ...options }],
    queryFn: ({ pageParam = 0 }) => projectTasksAPI.list({
      skip: pageParam,
      limit,
      team_id: options?.team_id,
      project_id: options?.project_id,
      assignee_id: options?.assignee_id,
      status: options?.status,
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
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single task by ID
 */
export function useProjectTask(taskId: number, enabled = true) {
  return useQuery({
    queryKey: projectTaskKeys.detail(taskId),
    queryFn: () => projectTasksAPI.get(taskId),
    enabled: enabled && !!taskId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new task
 * Automatically invalidates and refetches tasks list
 */
export function useCreateProjectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectTaskCreate) => projectTasksAPI.create(data),
    onSuccess: (newTask) => {
      // Invalidate tasks list to refetch
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.lists() });
      // Optionally add the new task to cache optimistically
      queryClient.setQueryData(projectTaskKeys.detail(newTask.id), newTask);
    },
    onError: (error) => {
      console.error('Failed to create project task:', error);
    },
  });
}

/**
 * Hook to update a task
 * Automatically updates cache and invalidates queries
 */
export function useUpdateProjectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectTaskUpdate }) =>
      projectTasksAPI.update(id, data),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(projectTaskKeys.detail(updatedTask.id), updatedTask);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update project task:', error);
    },
  });
}

/**
 * Hook to delete a task
 * Automatically removes from cache and invalidates queries
 */
export function useDeleteProjectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectTasksAPI.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: projectTaskKeys.detail(deletedId) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete project task:', error);
    },
  });
}
