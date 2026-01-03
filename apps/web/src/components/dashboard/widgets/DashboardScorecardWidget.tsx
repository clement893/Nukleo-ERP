'use client';

/**
 * Widget : Tableau de Bord Complet (Scorecard)
 * Vue d'ensemble des KPIs principaux de l'entreprise
 */

import { BarChart3, TrendingUp, DollarSign, Users, FolderKanban, Target } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { employeesAPI } from '@/lib/api/employees';
import { projectsAPI } from '@/lib/api/projects';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';

interface KPI {
  name: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  format: 'currency' | 'number' | 'percent';
}

export function DashboardScorecardWidget({ }: WidgetProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [revenueData, opportunities, employees, projects, expenses] = await Promise.all([
          fetchDashboardRevenue({ months: 2 }),
          opportunitiesAPI.list(),
          employeesAPI.list(),
          projectsAPI.list(),
          expenseAccountsAPI.list(),
        ]);
        
        const currentRevenue = revenueData.total || 0;
        const previousRevenue = revenueData.data.length > 1 
          ? (revenueData.data[revenueData.data.length - 2]?.value || 0)
          : 0;
        const revenueChange = previousRevenue > 0 
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
          : 0;
        
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        ).length;
        const totalEmployees = employees.length;
        const employeeGrowth = totalEmployees > 0 
          ? ((activeEmployees / totalEmployees) * 100) - 100 
          : 0;
        
        const activeProjects = projects.filter((p: any) => p.status === 'active').length;
        const totalProjects = projects.length;
        const projectProgress = totalProjects > 0 
          ? (activeProjects / totalProjects) * 100 
          : 0;
        
        const wonOpportunities = opportunities.filter((opp: any) => 
          opp.status === 'won' || opp.closed_at
        ).length;
        const totalOpportunities = opportunities.length;
        const winRate = totalOpportunities > 0 
          ? (wonOpportunities / totalOpportunities) * 100 
          : 0;
        
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
        const profit = currentRevenue - totalExpenses;
        const profitMargin = currentRevenue > 0 
          ? (profit / currentRevenue) * 100 
          : 0;
        
        const calculatedKPIs: KPI[] = [
          {
            name: 'Revenus',
            value: currentRevenue,
            change: revenueChange,
            icon: DollarSign,
            color: 'text-green-600 dark:text-green-400',
            format: 'currency',
          },
          {
            name: 'Marge bénéficiaire',
            value: profitMargin,
            change: 0, // Would need historical data
            icon: Target,
            color: 'text-blue-600 dark:text-blue-400',
            format: 'percent',
          },
          {
            name: 'Taux de réussite',
            value: winRate,
            change: 0, // Would need historical data
            icon: TrendingUp,
            color: 'text-purple-600 dark:text-purple-400',
            format: 'percent',
          },
          {
            name: 'Employés actifs',
            value: activeEmployees,
            change: employeeGrowth,
            icon: Users,
            color: 'text-indigo-600 dark:text-indigo-400',
            format: 'number',
          },
          {
            name: 'Projets actifs',
            value: activeProjects,
            change: projectProgress - 50, // Relative to target
            icon: FolderKanban,
            color: 'text-amber-600 dark:text-amber-400',
            format: 'number',
          },
        ];
        
        setKpis(calculatedKPIs);
      } catch (error) {
        console.error('Error loading dashboard scorecard:', error);
        setKpis([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (kpis.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Aucune donnée"
        description="Les KPIs apparaîtront ici."
        variant="compact"
      />
    );
  }

  const formatValue = (value: number, format: string): string => {
    if (format === 'currency') {
      return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    }
    if (format === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('fr-FR');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Tableau de Bord</p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            const isPositive = kpi.change >= 0;
            
            return (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {kpi.name}
                    </p>
                  </div>
                  {kpi.change !== 0 && (
                    <span className={`text-xs font-medium ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? '+' : ''}{kpi.change.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>
                  {formatValue(typeof kpi.value === 'number' ? kpi.value : 0, kpi.format)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
