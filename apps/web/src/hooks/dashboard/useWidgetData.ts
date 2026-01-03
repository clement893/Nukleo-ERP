/**
 * Hook personnalisé pour gérer les données des widgets
 */

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import type { WidgetConfig, GlobalFilters, WidgetType } from '@/lib/dashboard/types';
import { fetchDashboardOpportunities } from '@/lib/api/dashboard-opportunities';
import { fetchClientsStats } from '@/lib/api/dashboard-clients';
import { fetchDashboardProjects } from '@/lib/api/dashboard-projects';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { quotesAPI } from '@/lib/api/quotes';
import { submissionsAPI } from '@/lib/api/submissions';
import { testimonialsAPI } from '@/lib/api/testimonials';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api/projects';
import { employeesAPI } from '@/lib/api/employees';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { clientsAPI } from '@/lib/api/clients';
import { timeEntriesAPI } from '@/lib/api/time-entries';

interface UseWidgetDataOptions {
  widgetType: WidgetType;
  config: WidgetConfig;
  globalFilters?: GlobalFilters;
  enabled?: boolean;
}

/**
 * Hook pour récupérer les données d'un widget
 */
export function useWidgetData<T = any>({
  widgetType,
  config,
  globalFilters,
  enabled = true,
}: UseWidgetDataOptions): UseQueryResult<T> {
  return useQuery({
    queryKey: ['widget-data', widgetType, config, globalFilters],
    queryFn: async () => {
      try {
        // TODO: Implémenter les appels API spécifiques par type de widget
        // Pour l'instant, on retourne des données factices
        const result = await fetchWidgetData(widgetType, config, globalFilters);
        // Ensure we always return valid data
        if (!result) {
          throw new Error(`No data returned for widget ${widgetType}`);
        }
        return result;
      } catch (error) {
        // Log error for debugging
        console.error(`Error fetching widget data for ${widgetType}:`, error);
        // Return fallback data instead of throwing
        // This ensures widgets always have data to display
        return getFallbackData(widgetType) as T;
      }
    },
    enabled,
    staleTime: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : 5 * 60 * 1000, // 5 minutes par défaut
    refetchInterval: config.refresh_interval 
      ? config.refresh_interval * 1000 
      : false,
    // Don't throw errors - return fallback data instead
    throwOnError: false,
    retry: 1, // Retry once on failure
    retryDelay: 1000,
  });
}

/**
 * Get fallback data for a widget type when API calls fail
 */
function getFallbackData(widgetType: WidgetType): any {
  switch (widgetType) {
    case 'opportunities-list':
      return {
        opportunities: [],
        total: 0,
        page: 1,
        page_size: 10,
      };
    
    case 'clients-count':
      return {
        count: 0,
        growth: 0,
        previous_count: 0,
        new_this_month: 0,
        active_count: 0,
        active_growth: 0,
        previous_active_count: 0,
      };
    
    case 'projects-active':
      return {
        projects: [],
        total: 0,
        page: 1,
        page_size: 10,
      };
    
    case 'revenue-chart':
      return {
        data: [],
        total: 0,
        growth: 0,
        period: 'month',
      };
    
    case 'kpi-custom':
      return {
        value: 0,
        unit: '%',
        label: 'KPI',
        growth: 0,
        target: 0,
        progress: 0,
      };
    
    case 'quotes-list':
      return {
        quotes: [],
        total: 0,
      };
    
    case 'submissions-list':
      return {
        submissions: [],
        total: 0,
      };
    
    case 'testimonials-carousel':
      return {
        testimonials: [],
      };
    
    case 'opportunities-pipeline':
      return {
        opportunities: [],
        groupedByStage: {},
        total: 0,
      };
    
    case 'opportunities-needing-action':
      return {
        opportunities: [],
        total: 0,
      };
    
    case 'clients-growth':
      return {
        data: [],
      };
    
    case 'projects-status':
      return {
        statusCounts: {},
        total: 0,
      };
    
    case 'tasks-kanban':
      return {
        tasks: [],
        groupedByStatus: {},
        total: 0,
      };
    
    case 'cash-flow':
      return {
        data: [],
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
      };
    
    case 'employees-count':
      return {
        count: 0,
        previous_count: 0,
        growth: 0,
      };
    
    case 'commercial-stats':
      return {
        opportunities_count: 0,
        quotes_count: 0,
        submissions_count: 0,
        total_value: 0,
        quotes_value: 0,
      };
    
    case 'goals-progress':
      return {
        goals: [],
      };
    
    case 'growth-chart':
      return {
        data: [],
      };
    
    case 'workload-chart':
      return {
        workload: [],
      };
    
    default:
      return {
        message: 'Widget data not available',
        widgetType,
      };
  }
}

/**
 * Fonction pour récupérer les données d'un widget
 * Utilise les vrais appels API avec fallback sur données factices
 */
async function fetchWidgetData(
  widgetType: WidgetType,
  config?: WidgetConfig,
  globalFilters?: GlobalFilters
): Promise<any> {
  
  // Appeler les vrais endpoints API avec gestion d'erreur robuste
  switch (widgetType) {
    case 'opportunities-list':
      try {
        const data = await fetchDashboardOpportunities({
          limit: 5,
          offset: 0,
          company_id: globalFilters?.company_id,
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'opportunities' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching opportunities, using empty data:', error);
        // Return empty data instead of sample data
        return {
          opportunities: [],
          total: 0,
          page: 1,
          page_size: 10,
        };
      }
    
    case 'clients-count':
      try {
        const period = config?.period && config.period !== 'custom' ? config.period : 'month';
        const data = await fetchClientsStats({
          period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'count' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching clients stats, using empty data:', error);
        return {
          count: 0,
          growth: 0,
          previous_count: 0,
          new_this_month: 0,
          active_count: 0,
          active_growth: 0,
          previous_active_count: 0,
        };
      }
    
    case 'projects-active':
      try {
        const data = await fetchDashboardProjects({
          limit: 5,
          offset: 0,
          status: 'ACTIVE',
          client_id: globalFilters?.company_id,
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'projects' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching projects, using empty data:', error);
        return {
          projects: [],
          total: 0,
          page: 1,
          page_size: 10,
        };
      }
    
    case 'revenue-chart':
      const period = config?.period && config.period !== 'custom' ? config.period : 'month';
      try {
        const data = await fetchDashboardRevenue({
          period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
          months: 6,
        });
        // Validate data structure
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        throw new Error('Invalid data structure from API');
      } catch (error) {
        console.warn('Error fetching revenue, using empty data:', error);
        return {
          data: [],
          total: 0,
          growth: 0,
          period: period || 'month',
        };
      }
    
    case 'kpi-custom':
      // KPI widget doesn't need API call, return default data
      return {
        value: 0,
        unit: '%',
        label: 'KPI',
        growth: 0,
        target: config?.target || 0,
        progress: 0,
      };
    
    case 'quotes-list':
      try {
        const limit = config?.filters?.limit || 5;
        const quotes = await quotesAPI.list(0, limit, globalFilters?.company_id);
        return {
          quotes: quotes || [],
          total: quotes?.length || 0,
        };
      } catch (error) {
        console.warn('Error fetching quotes, using empty data:', error);
        return {
          quotes: [],
          total: 0,
        };
      }
    
    case 'submissions-list':
      try {
        const limit = config?.filters?.limit || 5;
        const submissions = await submissionsAPI.list(0, limit, globalFilters?.company_id);
        return {
          submissions: submissions || [],
          total: submissions?.length || 0,
        };
      } catch (error) {
        console.warn('Error fetching submissions, using empty data:', error);
        return {
          submissions: [],
          total: 0,
        };
      }
    
    case 'testimonials-carousel':
      try {
        const testimonials = await testimonialsAPI.list({
          limit: 10,
          is_published: 'true',
        });
        return {
          testimonials: testimonials || [],
        };
      } catch (error) {
        console.warn('Error fetching testimonials, using empty data:', error);
        return {
          testimonials: [],
        };
      }
    
    case 'opportunities-pipeline':
      try {
        const pipelineId = config?.filters?.pipeline_id || globalFilters?.project_id;
        const opportunities = await opportunitiesAPI.list(0, 100, {
          pipeline_id: pipelineId as string,
        });
        // Group by stage
        const groupedByStage: Record<string, any[]> = {};
        opportunities.forEach((opp: any) => {
          const stage = opp.stage_name || opp.stage || 'unknown';
          if (!groupedByStage[stage]) {
            groupedByStage[stage] = [];
          }
          groupedByStage[stage].push(opp);
        });
        return {
          opportunities,
          groupedByStage,
          total: opportunities.length,
        };
      } catch (error) {
        console.warn('Error fetching opportunities pipeline, using empty data:', error);
        return {
          opportunities: [],
          groupedByStage: {},
          total: 0,
        };
      }
    
    case 'opportunities-needing-action':
      try {
        const opportunities = await opportunitiesAPI.list(0, 20);
        // Filter opportunities that need action (e.g., pending submission, overdue, etc.)
        const needingAction = opportunities.filter((opp: any) => {
          // Simple logic: opportunities with expected_close_date in the past or soon
          if (opp.expected_close_date) {
            const closeDate = new Date(opp.expected_close_date);
            const now = new Date();
            const daysDiff = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7; // Within 7 days
          }
          return false;
        });
        return {
          opportunities: needingAction.slice(0, 5),
          total: needingAction.length,
        };
      } catch (error) {
        console.warn('Error fetching opportunities needing action, using empty data:', error);
        return {
          opportunities: [],
          total: 0,
        };
      }
    
    case 'clients-growth':
      try {
        const clients = await clientsAPI.list();
        // Group by month
        const grouped: Record<string, number> = {};
        clients.forEach((client: any) => {
          if (client.created_at) {
            const date = new Date(client.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            grouped[monthKey] = (grouped[monthKey] || 0) + 1;
          }
        });
        // Convert to array and sort
        const data = Object.entries(grouped)
          .map(([month, count]) => ({
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            count,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6); // Last 6 months
        return {
          data,
        };
      } catch (error) {
        console.warn('Error fetching clients growth, using empty data:', error);
        return {
          data: [],
        };
      }
    
    case 'projects-status':
      try {
        const projects = await projectsAPI.list(0, 1000);
        // Group by status
        const statusCounts: Record<string, number> = {};
        projects.forEach((project: any) => {
          const status = project.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        return {
          statusCounts,
          total: projects.length,
        };
      } catch (error) {
        console.warn('Error fetching projects status, using empty data:', error);
        return {
          statusCounts: {},
          total: 0,
        };
      }
    
    case 'tasks-kanban':
      try {
        const tasks = await projectTasksAPI.list({
          project_id: globalFilters?.project_id,
          assignee_id: globalFilters?.employee_id,
        });
        // Group by status
        const groupedByStatus: Record<string, any[]> = {};
        tasks.forEach((task: any) => {
          const status = task.status || 'todo';
          if (!groupedByStatus[status]) {
            groupedByStatus[status] = [];
          }
          groupedByStatus[status].push(task);
        });
        return {
          tasks,
          groupedByStatus,
          total: tasks.length,
        };
      } catch (error) {
        console.warn('Error fetching tasks kanban, using empty data:', error);
        return {
          tasks: [],
          groupedByStatus: {},
          total: 0,
        };
      }
    
    case 'cash-flow':
      try {
        // Load revenue and expenses
        const period = config?.period && config.period !== 'custom' ? config.period : 'month';
        const [revenueData, expenses] = await Promise.all([
          fetchDashboardRevenue({
            period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
            months: 6,
          }),
          expenseAccountsAPI.list(),
        ]);
        
        // Group revenue by month
        const revenueByMonth: Record<string, number> = {};
        if (revenueData?.data) {
          revenueData.data.forEach((item: any) => {
            const monthKey = item.month || item.date || '';
            if (monthKey) {
              revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (item.value || item.amount || 0);
            }
          });
        }
        
        // Group expenses by month
        const expensesByMonth: Record<string, number> = {};
        expenses.forEach((expense: any) => {
          if (expense.expense_date) {
            const date = new Date(expense.expense_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(expense.total_amount || 0);
            expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
          }
        });
        
        // Combine data
        const allMonths = new Set([...Object.keys(revenueByMonth), ...Object.keys(expensesByMonth)]);
        const data = Array.from(allMonths)
          .map(month => ({
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            income: revenueByMonth[month] || 0,
            expenses: expensesByMonth[month] || 0,
            net: (revenueByMonth[month] || 0) - (expensesByMonth[month] || 0),
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);
        
        const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
        const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
        
        return {
          data,
          totalIncome,
          totalExpenses,
          netCashFlow: totalIncome - totalExpenses,
        };
      } catch (error) {
        console.warn('Error fetching cash flow, using empty data:', error);
        return {
          data: [],
          totalIncome: 0,
          totalExpenses: 0,
          netCashFlow: 0,
        };
      }
    
    case 'employees-count':
      try {
        const employees = await employeesAPI.list();
        const count = employees.length;
        
        // Calculate previous period (last month)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const previousCount = employees.filter((emp: any) => {
          if (!emp.hire_date) return false;
          const hireDate = new Date(emp.hire_date);
          return hireDate < oneMonthAgo;
        }).length;
        
        const growth = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;
        
        return {
          count,
          previous_count: previousCount,
          growth,
        };
      } catch (error) {
        console.warn('Error fetching employees count, using empty data:', error);
        return {
          count: 0,
          previous_count: 0,
          growth: 0,
        };
      }
    
    case 'commercial-stats':
      try {
        // Aggregate stats from multiple sources
        const [opportunities, quotes, submissions] = await Promise.all([
          opportunitiesAPI.list(0, 1000),
          quotesAPI.list(0, 1000),
          submissionsAPI.list(0, 1000),
        ]);

        const totalOpportunities = opportunities.length;
        const totalQuotes = quotes.length;
        const totalSubmissions = submissions.length;

        const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (opp.amount || 0), 0);
        const totalQuotesValue = quotes.reduce((sum: number, q: any) => sum + (q.amount || 0), 0);

        return {
          opportunities_count: totalOpportunities,
          quotes_count: totalQuotes,
          submissions_count: totalSubmissions,
          total_value: totalValue,
          quotes_value: totalQuotesValue,
        };
      } catch (error) {
        console.warn('Error fetching commercial stats, using empty data:', error);
        return {
          opportunities_count: 0,
          quotes_count: 0,
          submissions_count: 0,
          total_value: 0,
          quotes_value: 0,
        };
      }
    
    case 'goals-progress':
      try {
        const [opportunities, projects] = await Promise.all([
          opportunitiesAPI.list(0, 100),
          projectsAPI.list(),
        ]);
        
        const goals: any[] = [];
        
        // Goal 1: Opportunities won
        const wonOpportunities = opportunities.filter((opp: any) => opp.status === 'won');
        const totalOpportunitiesValue = wonOpportunities.reduce((sum: number, opp: any) => 
          sum + (opp.amount || 0), 0
        );
        goals.push({
          id: 'opportunities-won',
          name: 'Opportunités gagnées',
          target: 1000000,
          current: totalOpportunitiesValue,
          unit: '€',
        });
        
        // Goal 2: Projects completed
        const completedProjects = projects.filter((p: any) => p.status === 'COMPLETED');
        goals.push({
          id: 'projects-completed',
          name: 'Projets terminés',
          target: 10,
          current: completedProjects.length,
          unit: '',
        });
        
        return {
          goals,
        };
      } catch (error) {
        console.warn('Error fetching goals progress, using empty data:', error);
        return {
          goals: [],
        };
      }
    
    case 'growth-chart':
      try {
        const [clients, projects, opportunities] = await Promise.all([
          clientsAPI.list(),
          projectsAPI.list(),
          opportunitiesAPI.list(0, 1000),
        ]);
        
        // Group by month
        const clientsByMonth: Record<string, number> = {};
        const projectsByMonth: Record<string, number> = {};
        const opportunitiesByMonth: Record<string, number> = {};
        
        clients.forEach((client: any) => {
          if (client.created_at) {
            const date = new Date(client.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            clientsByMonth[monthKey] = (clientsByMonth[monthKey] || 0) + 1;
          }
        });
        
        projects.forEach((project: any) => {
          if (project.created_at) {
            const date = new Date(project.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            projectsByMonth[monthKey] = (projectsByMonth[monthKey] || 0) + 1;
          }
        });
        
        opportunities.forEach((opp: any) => {
          if (opp.created_at) {
            const date = new Date(opp.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            opportunitiesByMonth[monthKey] = (opportunitiesByMonth[monthKey] || 0) + 1;
          }
        });
        
        // Combine all months
        const allMonths = new Set([
          ...Object.keys(clientsByMonth),
          ...Object.keys(projectsByMonth),
          ...Object.keys(opportunitiesByMonth),
        ]);
        
        const data = Array.from(allMonths)
          .map(month => ({
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            clients: clientsByMonth[month] || 0,
            projects: projectsByMonth[month] || 0,
            opportunities: opportunitiesByMonth[month] || 0,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);
        
        return {
          data,
        };
      } catch (error) {
        console.warn('Error fetching growth chart, using empty data:', error);
        return {
          data: [],
        };
      }
    
    case 'workload-chart':
      try {
        const [employees, timeEntries] = await Promise.all([
          employeesAPI.list(),
          timeEntriesAPI.list({}),
        ]);
        
        // Calculate workload for each employee (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const workload = employees.map((emp: any) => {
          const empTimeEntries = timeEntries.filter((entry: any) => {
            if (entry.user_id !== emp.user_id) return false;
            const entryDate = new Date(entry.date);
            return entryDate >= sevenDaysAgo;
          });
          
          const totalHours = empTimeEntries.reduce((sum: number, entry: any) => 
            sum + (entry.duration / 3600), 0
          );
          
          const weeklyCapacity = emp.capacity_hours_per_week || 35;
          const capacity = (weeklyCapacity / 7) * 7; // For 7 days
          
          return {
            name: `${emp.first_name} ${emp.last_name}`.trim() || 'Employé',
            hours: totalHours,
            capacity: capacity,
            utilization: capacity > 0 ? (totalHours / capacity) * 100 : 0,
          };
        }).filter(emp => emp.hours > 0)
          .sort((a, b) => b.utilization - a.utilization)
          .slice(0, 5);
        
        return {
          workload,
        };
      } catch (error) {
        console.warn('Error fetching workload chart, using empty data:', error);
        return {
          workload: [],
        };
      }
    
    default:
      return {
        message: 'Widget data not implemented yet',
        widgetType,
      };
  }
}

/**
 * Hook pour rafraîchir manuellement les données d'un widget
 */
export function useWidgetRefresh(widgetType: WidgetType) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({
      queryKey: ['widget-data', widgetType],
    });
  };
}
