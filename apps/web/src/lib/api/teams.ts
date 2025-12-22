/**
 * Teams API Client
 * Client for team management API endpoints
 */

import { apiClient } from './client';
import type { ApiResponse } from '@modele/types';

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role_id: number;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
  role?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
  owner?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
}

export interface TeamCreate {
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface TeamMemberAdd {
  user_id: number;
  role_id: number;
}

export interface TeamMemberUpdate {
  role_id: number;
}

export interface TeamListResponse {
  teams: Team[];
  total: number;
}

export const teamsAPI = {
  listTeams: async (skip = 0, limit = 100): Promise<ApiResponse<TeamListResponse>> => {
    return apiClient.get<TeamListResponse>(/teams?skip=&limit=);
  },
  getTeam: async (teamId: number): Promise<ApiResponse<Team>> => {
    return apiClient.get<Team>(/teams/);
  },
  createTeam: async (data: TeamCreate): Promise<ApiResponse<Team>> => {
    return apiClient.post<Team>('/teams', data);
  },
  updateTeam: async (teamId: number, data: TeamUpdate): Promise<ApiResponse<Team>> => {
    return apiClient.put<Team>(/teams/, data);
  },
  deleteTeam: async (teamId: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(/teams/);
  },
  getTeamMembers: async (teamId: number): Promise<ApiResponse<TeamMember[]>> => {
    return apiClient.get<TeamMember[]>(/teams//members);
  },
  addTeamMember: async (teamId: number, data: TeamMemberAdd): Promise<ApiResponse<TeamMember>> => {
    return apiClient.post<TeamMember>(/teams//members, data);
  },
  updateTeamMember: async (teamId: number, memberId: number, data: TeamMemberUpdate): Promise<ApiResponse<TeamMember>> => {
    return apiClient.put<TeamMember>(/teams//members/, data);
  },
  removeTeamMember: async (teamId: number, memberId: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(/teams//members/);
  },
  getMyTeams: async (): Promise<ApiResponse<TeamListResponse>> => {
    return apiClient.get<TeamListResponse>('/teams');
  },
};