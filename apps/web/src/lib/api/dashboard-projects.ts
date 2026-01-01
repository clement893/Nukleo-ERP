/**
 * API Client for Dashboard Projects Widget
 * 
 * This module provides functions to fetch projects data for the dashboard.
 * Used by ProjectsActiveWidget to display active projects with progress.
 * 
 * @module dashboard-projects
 */

import { apiClient } from './client';

export interface ProjectListItem {
  id: number;
  name: string;
  client: string;
  client_id: number;
  progress: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectsResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Fetch active projects for dashboard widget
 * 
 * @param params - Query parameters
 * @param params.limit - Number of projects to fetch (default: 5)
 * @param params.offset - Offset for pagination (default: 0)
 * @param params.status - Filter by status (default: 'ACTIVE')
 * @param params.client_id - Filter by client (optional)
 * @returns Promise with projects data
 */
export async function fetchDashboardProjects(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  client_id?: number;
}): Promise<ProjectsResponse> {
  const queryParams = new URLSearchParams();
  
  queryParams.append('limit', (params?.limit || 5).toString());
  queryParams.append('offset', (params?.offset || 0).toString());
  queryParams.append('status', params?.status || 'ACTIVE');
  
  if (params?.client_id) {
    queryParams.append('client_id', params.client_id.toString());
  }

  try {
    const response = await apiClient.get(
      `/v1/projects?${queryParams.toString()}`
    );

    const data = response.data as { items?: any[] } | any[] | undefined;
    const items = (Array.isArray(data) ? data : data?.items || []) as any[];
    
    if (!items || items.length === 0) {
      console.log('No projects returned from API (this may be normal if no projects exist)');
      return {
        projects: [],
        total: 0,
        page: 1,
        page_size: 10,
      };
    }
    
    // Transform data to match widget format
    const projects = items.map((project: any) => ({
      id: project.id,
      name: project.name || 'Sans nom',
      client: project.client?.name || project.client_name || project.client?.first_name && project.client?.last_name 
        ? `${project.client.first_name} ${project.client.last_name}` 
        : 'N/A',
      client_id: project.client_id || project.client?.id,
      progress: project.progress ?? 0,
      status: project.status || 'ACTIVE',
      due_date: project.due_date || project.end_date || project.deadline,
      created_at: project.created_at,
      updated_at: project.updated_at,
    })).filter((p: any) => p.id); // Filter out invalid projects

    const responseData = response.data as { total?: number; page?: number; page_size?: number } | undefined;
    
    console.log(`Fetched ${projects.length} projects for dashboard widget`);
    
    return {
      projects,
      total: (responseData && 'total' in responseData ? responseData.total : undefined) || projects.length,
      page: (responseData && 'page' in responseData ? responseData.page : undefined) || 1,
      page_size: (responseData && 'page_size' in responseData ? responseData.page_size : undefined) || 10,
    };
  } catch (error) {
    console.error('Error fetching dashboard projects:', error);
    // Return empty array instead of throwing - widget will show empty state
    return {
      projects: [],
      total: 0,
      page: 1,
      page_size: 10,
    };
  }
}

/**
 * Fetch projects statistics
 * 
 * @returns Promise with projects statistics
 */
export async function fetchProjectsStats(): Promise<{
  total: number;
  active: number;
  completed: number;
  archived: number;
  avg_progress: number;
}> {
  try {
    const response = await apiClient.get('/v1/projects/stats');
    const data = response.data as {
      total: number;
      active: number;
      completed: number;
      archived: number;
      avg_progress: number;
    };
    
    // Validate response structure
    if (data && typeof data === 'object' && 'total' in data) {
      return data;
    }
    
    // If response structure is invalid, fall through to fallback
    throw new Error('Invalid response structure from stats endpoint');
  } catch (error) {
    console.warn('Error fetching projects stats from endpoint, calculating from list:', error);
    
    // Fallback: calculate from projects list
    try {
      const projectsResponse = await apiClient.get('/v1/projects?limit=10000');
      const projectsData = projectsResponse.data as { items?: any[] } | any[] | undefined;
      const projects = (Array.isArray(projectsData) ? projectsData : projectsData?.items || []) as any[];
      
      if (!projects || projects.length === 0) {
        console.warn('No projects found in fallback calculation');
        return {
          total: 0,
          active: 0,
          completed: 0,
          archived: 0,
          avg_progress: 0,
        };
      }
      
      const active = projects.filter((p: any) => {
        const status = p.status?.toUpperCase() || '';
        return status === 'ACTIVE' || status === 'PROJECTSTATUS.ACTIVE';
      }).length;
      const completed = projects.filter((p: any) => {
        const status = p.status?.toUpperCase() || '';
        return status === 'COMPLETED' || status === 'PROJECTSTATUS.COMPLETED';
      }).length;
      const archived = projects.filter((p: any) => {
        const status = p.status?.toUpperCase() || '';
        return status === 'ARCHIVED' || status === 'PROJECTSTATUS.ARCHIVED';
      }).length;
      
      const avgProgress = projects.length > 0
        ? projects.reduce((sum: number, p: any) => {
            const progress = p.progress ?? 0;
            return sum + (typeof progress === 'number' ? progress : 0);
          }, 0) / projects.length
        : 0;
      
      console.log('Projects stats calculated from fallback:', {
        total: projects.length,
        active,
        completed,
        archived,
        avgProgress: Math.round(avgProgress),
      });
      
      return {
        total: projects.length,
        active,
        completed,
        archived,
        avg_progress: Math.round(avgProgress),
      };
    } catch (fallbackError) {
      console.error('Error in fallback calculation for projects stats:', fallbackError);
      // Return zero values only as last resort
      return {
        total: 0,
        active: 0,
        completed: 0,
        archived: 0,
        avg_progress: 0,
      };
    }
  }
}
