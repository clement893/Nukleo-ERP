/**
 * React Query Hooks for API Calls
 * 
 * Provides typed React Query hooks for all API endpoints
 * with automatic caching, error handling, and refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  usersAPI, 
  subscriptionsAPI, 
  teamsAPI, 
  invitationsAPI,
} from '@/lib/api';
import { teamsAPI as teamsAPIClient } from '@/lib/api/teams';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { employeesAPI } from '@/lib/api/employees';
import { facturationsAPI } from '@/lib/api/finances/facturations';
import { onboardingAPI } from '@/lib/api/onboarding';
import { extractApiData } from '@/lib/api/utils';
import { TokenStorage } from '@/lib/auth/tokenStorage';

// Query Keys Factory
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    me: ['users', 'me'] as const,
  },
  subscriptions: {
    plans: (activeOnly?: boolean) => ['subscriptions', 'plans', activeOnly] as const,
    plan: (id: number) => ['subscriptions', 'plans', id] as const,
    me: ['subscriptions', 'me'] as const,
    payments: ['subscriptions', 'payments'] as const,
  },
  teams: {
    all: ['teams'] as const,
    detail: (id: string | number) => ['teams', id] as const,
    bySlug: (slug: string) => ['teams', 'slug', slug] as const,
    members: (id: string | number) => ['teams', id, 'members'] as const,
  },
  projectTasks: {
    all: ['project-tasks'] as const,
    lists: () => ['project-tasks', 'list'] as const,
    list: (filters?: {
      team_id?: number;
      project_id?: number;
      assignee_id?: number;
      status?: string;
    }) => ['project-tasks', 'list', filters] as const,
    detail: (id: number) => ['project-tasks', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters?: { team_id?: number }) => ['employees', 'list', filters] as const,
    detail: (id: number) => ['employees', id] as const,
  },
  onboarding: {
    steps: ['onboarding', 'steps'] as const,
    progress: ['onboarding', 'progress'] as const,
    employeeProgress: (employeeId: number) => ['onboarding', 'employee', employeeId, 'progress'] as const,
    employeeSteps: (employeeId: number) => ['onboarding', 'employee', employeeId, 'steps'] as const,
    employeesList: (filters?: { team_id?: number }) => ['onboarding', 'employees', filters] as const,
  },
  facturations: {
    all: ['facturations'] as const,
    list: (filters?: { status?: string; project_id?: number }) => ['facturations', 'list', filters] as const,
    detail: (id: number) => ['facturations', id] as const,
  },
  invitations: {
    all: (params?: { status?: string }) => ['invitations', params] as const,
    detail: (id: string) => ['invitations', id] as const,
  },
  resources: {
    all: ['resources'] as const,
    detail: (id: string) => ['resources', id] as const,
  },
} as const;

// Auth Hooks
export function useAuth() {
  // Only enable query if we're in browser and have a token
  const hasToken = typeof window !== 'undefined' && !!TokenStorage.getToken();
  
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => usersAPI.getMe(),
    enabled: typeof window !== 'undefined' && !!hasToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if token is missing
  });
}

// User Hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersAPI.getUsers(),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => usersAPI.getUser(userId),
    enabled: !!userId,
  });
}

export function useMe() {
  // Only enable query if we're in browser and have a token
  const hasToken = typeof window !== 'undefined' && !!TokenStorage.getToken();
  
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => usersAPI.getMe(),
    enabled: typeof window !== 'undefined' && !!hasToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if token is missing
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => usersAPI.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

// Subscription Hooks
export function useSubscriptionPlans(activeOnly: boolean = true) {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans(activeOnly),
    queryFn: () => subscriptionsAPI.getPlans(activeOnly),
    staleTime: 1000 * 60 * 30, // 30 minutes - plans don't change often
  });
}

export function useSubscriptionPlan(planId: number) {
  return useQuery({
    queryKey: queryKeys.subscriptions.plan(planId),
    queryFn: () => subscriptionsAPI.getPlan(planId),
    enabled: !!planId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: queryKeys.subscriptions.me,
    queryFn: () => subscriptionsAPI.getMySubscription(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (no subscription)
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

export function useSubscriptionPayments() {
  return useQuery({
    queryKey: queryKeys.subscriptions.payments,
    queryFn: () => subscriptionsAPI.getPayments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data: {
      plan_id: number;
      success_url: string;
      cancel_url: string;
      trial_days?: number;
    }) => subscriptionsAPI.createCheckoutSession(data),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => subscriptionsAPI.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
    },
  });
}

// Teams Hooks
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: async () => {
      const response = await teamsAPIClient.list();
      return extractApiData(response);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTeam(teamId: string | number) {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: async () => {
      const response = await teamsAPIClient.getTeam(typeof teamId === 'string' ? parseInt(teamId) : teamId);
      return extractApiData(response);
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTeamBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.teams.bySlug(slug),
    queryFn: async () => {
      const response = await teamsAPIClient.getTeamBySlug(slug);
      return extractApiData(response);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTeamMembers(teamId: string | number) {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId),
    queryFn: async () => {
      const response = await teamsAPIClient.getTeamMembers(typeof teamId === 'string' ? parseInt(teamId) : teamId);
      return extractApiData(response) || [];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const response = await teamsAPIClient.create(data);
      return extractApiData(response);
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      if (newTeam?.slug) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.bySlug(newTeam.slug) });
      }
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: { name?: string; description?: string } }) =>
      teamsAPI.update(teamId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (teamId: string) => teamsAPI.delete(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

// Invitations Hooks
export function useInvitations(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.invitations.all(params),
    queryFn: () => invitationsAPI.list(params),
  });
}

export function useInvitation(invitationId: string) {
  return useQuery({
    queryKey: queryKeys.invitations.detail(invitationId),
    queryFn: () => invitationsAPI.get(invitationId),
    enabled: !!invitationId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; role: string; organization_id?: string }) =>
      invitationsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all() });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invitationId: string) => invitationsAPI.cancel(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all() });
    },
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) => invitationsAPI.resend(invitationId),
  });
}

// Project Tasks Hooks
export function useProjectTasks(options?: {
  team_id?: number;
  project_id?: number;
  assignee_id?: number;
  status?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.projectTasks.list(options),
    queryFn: () => projectTasksAPI.list({
      team_id: options?.team_id,
      project_id: options?.project_id,
      assignee_id: options?.assignee_id,
      status: options?.status as any,
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdateProjectTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ title: string; description: string; status: string; priority: string; team_id: number; project_id: number; assigned_to_id: number; due_date: string; estimated_hours: number }> }) =>
      projectTasksAPI.update(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks.detail(updatedTask.id) });
    },
  });
}

// Employees Hooks
export function useEmployees(options?: { team_id?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.employees.list(options),
    queryFn: () => employeesAPI.list(0, 1000).then(employees => {
      if (options?.team_id) {
        return employees.filter(emp => emp.team_id === options.team_id);
      }
      return employees;
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Facturations Hooks
export function useFacturations(options?: {
  status?: string;
  project_id?: number;
  skip?: number;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.facturations.list(options),
    queryFn: () => facturationsAPI.list({
      status: options?.status,
      project_id: options?.project_id,
      skip: options?.skip || 0,
      limit: options?.limit || 100,
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useFacturation(invoiceId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.facturations.detail(invoiceId),
    queryFn: () => facturationsAPI.get(invoiceId),
    enabled: enabled && !!invoiceId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateFacturation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoiceData: Parameters<typeof facturationsAPI.create>[0]) =>
      facturationsAPI.create(invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.list() });
    },
  });
}

export function useUpdateFacturation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof facturationsAPI.update>[1] }) =>
      facturationsAPI.update(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.detail(updatedInvoice.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.list() });
    },
  });
}

export function useDeleteFacturation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.delete(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.list() });
    },
  });
}

export function useSendFacturation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.send(invoiceId),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.detail(updatedInvoice.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.list() });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, paymentData }: { invoiceId: number; paymentData: Parameters<typeof facturationsAPI.createPayment>[1] }) =>
      facturationsAPI.createPayment(invoiceId, paymentData),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.list() });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, paymentId }: { invoiceId: number; paymentId: number }) =>
      facturationsAPI.deletePayment(invoiceId, paymentId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.facturations.list() });
    },
  });
}

// Onboarding Hooks
export function useOnboardingSteps() {
  return useQuery({
    queryKey: queryKeys.onboarding.steps,
    queryFn: () => onboardingAPI.getSteps(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOnboardingProgress() {
  return useQuery({
    queryKey: queryKeys.onboarding.progress,
    queryFn: () => onboardingAPI.getProgress(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEmployeesOnboarding(options?: { team_id?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.onboarding.employeesList(options),
    queryFn: () => onboardingAPI.listEmployeesOnboarding({
      team_id: options?.team_id,
      skip: 0,
      limit: 1000,
    }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEmployeeOnboardingProgress(employeeId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.onboarding.employeeProgress(employeeId),
    queryFn: () => onboardingAPI.getEmployeeProgress(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEmployeeOnboardingSteps(employeeId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.onboarding.employeeSteps(employeeId),
    queryFn: () => onboardingAPI.getEmployeeSteps(employeeId),
    enabled: enabled && !!employeeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useInitializeEmployeeOnboarding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (employeeId: number) => onboardingAPI.initializeEmployee(employeeId),
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.employeesList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.employeeProgress(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.employeeSteps(employeeId) });
    },
  });
}

export function useCompleteEmployeeStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, stepKey }: { employeeId: number; stepKey: string }) =>
      onboardingAPI.completeEmployeeStep(employeeId, stepKey),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.employeeProgress(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.employeeSteps(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.employeesList() });
    },
  });
}
