/**
 * React Query hooks for Employees
 * Provides cached, optimized API calls for employee management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { employeesAPI, type EmployeeCreate, type EmployeeUpdate } from '@/lib/api/employees';

// Re-export employeesAPI for convenience
export { employeesAPI };

// Query keys for employees
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters?: { skip?: number; limit?: number }) => 
    [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
};

/**
 * Hook to fetch employees list with pagination
 */
export function useEmployees(
  skip = 0,
  limit = 20,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: employeeKeys.list({ skip, limit }),
    queryFn: () => employeesAPI.list(skip, limit),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch employees with infinite scroll
 */
export function useInfiniteEmployees(
  limit = 20,
  options?: {
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...employeeKeys.lists(), 'infinite', { limit }],
    queryFn: ({ pageParam = 0 }) => employeesAPI.list(pageParam, limit),
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
 * Hook to fetch a single employee by ID
 */
export function useEmployee(employeeId: number, enabled = true) {
  return useQuery({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => employeesAPI.get(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmployeeCreate) => employeesAPI.create(data),
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.setQueryData(employeeKeys.detail(newEmployee.id), newEmployee);
    },
  });
}

/**
 * Hook to update an employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeUpdate }) => 
      employeesAPI.update(id, data),
    onSuccess: (updatedEmployee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.setQueryData(employeeKeys.detail(updatedEmployee.id), updatedEmployee);
    },
  });
}

/**
 * Hook to delete an employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeesAPI.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.removeQueries({ queryKey: employeeKeys.detail(deletedId) });
    },
  });
}

/**
 * Hook to delete all employees
 */
export function useDeleteAllEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => employeesAPI.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
