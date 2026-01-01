/**
 * React Query hooks for Expense Accounts
 */

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expenseAccountsAPI, type ExpenseAccountCreate, type ExpenseAccountUpdate, type ExpenseAccountAction } from '../api/finances/expenseAccounts';

// Re-export expenseAccountsAPI for convenience
export { expenseAccountsAPI };

/**
 * Query keys for expense accounts
 */
export const expenseAccountKeys = {
  all: ['expenseAccounts'] as const,
  lists: () => [...expenseAccountKeys.all, 'list'] as const,
  list: (filters?: { status?: string; employee_id?: number; search?: string }) => 
    [...expenseAccountKeys.lists(), filters] as const,
  details: () => [...expenseAccountKeys.all, 'detail'] as const,
  detail: (id: number) => [...expenseAccountKeys.details(), id] as const,
};

/**
 * Get list of expense accounts with pagination
 */
export function useExpenseAccounts(
  skip = 0,
  limit = 100,
  status?: string,
  employee_id?: number,
  search?: string
) {
  return useQuery({
    queryKey: expenseAccountKeys.list({ status, employee_id, search }),
    queryFn: () => expenseAccountsAPI.list(skip, limit, status as any, employee_id, search),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get infinite list of expense accounts (for infinite scroll)
 */
export function useInfiniteExpenseAccounts(
  limit = 20,
  status?: string,
  employee_id?: number,
  search?: string
) {
  return useInfiniteQuery({
    queryKey: expenseAccountKeys.list({ status, employee_id, search }),
    queryFn: ({ pageParam = 0 }) => 
      expenseAccountsAPI.list(pageParam, limit, status as any, employee_id, search),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    staleTime: 30000,
  });
}

/**
 * Get a single expense account by ID
 */
export function useExpenseAccount(expenseAccountId: number) {
  return useQuery({
    queryKey: expenseAccountKeys.detail(expenseAccountId),
    queryFn: () => expenseAccountsAPI.get(expenseAccountId),
    enabled: !!expenseAccountId,
    staleTime: 30000,
  });
}

/**
 * Create a new expense account
 */
export function useCreateExpenseAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseAccountCreate) => expenseAccountsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
    },
  });
}

/**
 * Update an expense account
 */
export function useUpdateExpenseAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseAccountUpdate }) =>
      expenseAccountsAPI.update(id, data),
    onSuccess: (data) => {
      // Mettre à jour le cache directement pour éviter les rechargements avec l'ancien statut
      queryClient.setQueryData(expenseAccountKeys.detail(data.id), data);
      // Invalider les listes pour qu'elles se rechargent avec le nouveau statut
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
    },
  });
}

/**
 * Delete an expense account
 */
export function useDeleteExpenseAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseAccountsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
    },
  });
}

/**
 * Submit an expense account for review
 */
export function useSubmitExpenseAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseAccountsAPI.submit(id),
    retry: false, // Désactiver le retry pour éviter les erreurs après succès
    onSuccess: (data) => {
      // Mettre à jour le cache directement pour éviter les rechargements avec l'ancien statut
      queryClient.setQueryData(expenseAccountKeys.detail(data.id), data);
      // Invalider les listes pour qu'elles se rechargent avec le nouveau statut
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
    },
  });
}

/**
 * Approve an expense account
 */
export function useApproveExpenseAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: ExpenseAccountAction }) =>
      expenseAccountsAPI.approve(id, action),
    retry: false, // Désactiver le retry pour éviter les erreurs après succès
    onSuccess: (data) => {
      // Mettre à jour le cache directement pour éviter les rechargements avec l'ancien statut
      queryClient.setQueryData(expenseAccountKeys.detail(data.id), data);
      // Ne pas invalider les queries pour éviter les erreurs de rechargement
      // Le cache sera mis à jour manuellement, et les queries se rechargeront lors de la prochaine navigation
    },
  });
}

/**
 * Reject an expense account
 */
export function useRejectExpenseAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: ExpenseAccountAction }) =>
      expenseAccountsAPI.reject(id, action),
    retry: false, // Désactiver le retry pour éviter les erreurs après succès
    onSuccess: (data) => {
      // Mettre à jour le cache directement pour éviter les rechargements avec l'ancien statut
      queryClient.setQueryData(expenseAccountKeys.detail(data.id), data);
      // Invalider les listes pour qu'elles se rechargent avec le nouveau statut
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
    },
  });
}

/**
 * Request clarification for an expense account
 */
export function useRequestClarification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: ExpenseAccountAction }) =>
      expenseAccountsAPI.requestClarification(id, action),
    retry: false, // Désactiver le retry pour éviter les erreurs après succès
    onSuccess: (data) => {
      // Mettre à jour le cache directement pour éviter les rechargements avec l'ancien statut
      queryClient.setQueryData(expenseAccountKeys.detail(data.id), data);
      // Invalider les listes pour qu'elles se rechargent avec le nouveau statut
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
    },
  });
}

/**
 * Set expense account under review
 */
export function useSetUnderReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseAccountsAPI.setUnderReview(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseAccountKeys.detail(data.id) });
    },
  });
}
