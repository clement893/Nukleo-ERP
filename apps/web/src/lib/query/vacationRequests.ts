/**
 * Vacation Requests React Query Hooks
 * Provides typed React Query hooks for vacation requests API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  vacationRequestsAPI,
  type VacationRequestCreate,
  type VacationRequestUpdate,
} from '@/lib/api/vacationRequests';

// Query Keys
export const vacationRequestKeys = {
  all: ['vacation-requests'] as const,
  lists: () => [...vacationRequestKeys.all, 'list'] as const,
  list: (filters?: { employee_id?: number; status?: string }) => 
    [...vacationRequestKeys.lists(), filters] as const,
  details: () => [...vacationRequestKeys.all, 'detail'] as const,
  detail: (id: number) => [...vacationRequestKeys.details(), id] as const,
  employee: (employeeId: number) => [...vacationRequestKeys.all, 'employee', employeeId] as const,
  status: (status: string) => [...vacationRequestKeys.all, 'status', status] as const,
};

/**
 * Get list of vacation requests
 */
export function useVacationRequests(params?: {
  employee_id?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: vacationRequestKeys.list(params),
    queryFn: () => vacationRequestsAPI.list(params),
  });
}

/**
 * Get infinite list of vacation requests (for pagination)
 */
export function useInfiniteVacationRequests(params?: {
  employee_id?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  pageSize?: number;
}) {
  const pageSize = params?.pageSize || 20;
  
  return useInfiniteQuery({
    queryKey: vacationRequestKeys.list(params),
    queryFn: ({ pageParam = 0 }) => 
      vacationRequestsAPI.list({
        ...params,
        skip: pageParam,
        limit: pageSize,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than pageSize, we're at the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length * pageSize;
    },
    initialPageParam: 0,
  });
}

/**
 * Get a single vacation request by ID
 */
export function useVacationRequest(requestId: number, enabled = true) {
  return useQuery({
    queryKey: vacationRequestKeys.detail(requestId),
    queryFn: () => vacationRequestsAPI.get(requestId),
    enabled: enabled && !!requestId,
  });
}

/**
 * Get vacation requests for a specific employee
 */
export function useEmployeeVacationRequests(employeeId: number) {
  return useQuery({
    queryKey: vacationRequestKeys.employee(employeeId),
    queryFn: () => vacationRequestsAPI.list({ employee_id: employeeId }),
    enabled: !!employeeId,
  });
}

/**
 * Create a new vacation request
 */
export function useCreateVacationRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: VacationRequestCreate) => vacationRequestsAPI.create(data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.employee(data.employee_id) });
    },
  });
}

/**
 * Update a vacation request
 */
export function useUpdateVacationRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VacationRequestUpdate }) =>
      vacationRequestsAPI.update(id, data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.employee(data.employee_id) });
    },
  });
}

/**
 * Approve a vacation request
 */
export function useApproveVacationRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: number) => vacationRequestsAPI.approve(requestId),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.employee(data.employee_id) });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.status('pending') });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.status('approved') });
      // Invalidate agenda queries to refresh calendar
      queryClient.invalidateQueries({ queryKey: ['agenda', 'events'] });
    },
  });
}

/**
 * Reject a vacation request
 */
export function useRejectVacationRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, rejectionReason }: { requestId: number; rejectionReason?: string }) =>
      vacationRequestsAPI.reject(requestId, rejectionReason),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.employee(data.employee_id) });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.status('pending') });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.status('rejected') });
    },
  });
}

/**
 * Delete a vacation request
 */
export function useDeleteVacationRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: number) => vacationRequestsAPI.delete(requestId),
    onSuccess: (_, requestId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.detail(requestId) });
      queryClient.invalidateQueries({ queryKey: vacationRequestKeys.lists() });
    },
  });
}
