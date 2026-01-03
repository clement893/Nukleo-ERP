'use client';

/**
 * Employees Stats Widget
 * Displays employee statistics (total, active, new, on leave)
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';
import { useInfiniteEmployees } from '@/lib/query/employees';
import type { ManagementWidgetProps } from '@/lib/management/types';

export function EmployeesStatsWidget({ widgetId, config }: ManagementWidgetProps) {
  const router = useRouter();
  const { data: employeesData, isLoading } = useInfiniteEmployees(1000);
  
  const employees = useMemo(() => employeesData?.pages.flat() || [], [employeesData]);
  
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e: any) => e.status === 'active').length;
    const inactive = employees.filter((e: any) => e.status !== 'active').length;
    
    // New employees this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = employees.filter((e: any) => {
      const created = new Date(e.created_at);
      return created >= startOfMonth;
    }).length;
    
    return { total, active, inactive, newThisMonth };
  }, [employees]);

  if (isLoading) {
    return (
      <Card className="glass-card p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="glass-card p-6 h-full cursor-pointer hover:border-primary-500/40 transition-all"
      onClick={() => router.push('/dashboard/management/employes')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30">
            <Users className="w-5 h-5 text-primary-500" />
          </div>
          <h3 className="font-semibold text-foreground">Employés</h3>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {stats.total}
          </div>
          <div className="text-sm text-muted-foreground">Total employés</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-lg font-semibold text-foreground">{stats.active}</div>
              <div className="text-xs text-muted-foreground">Actifs</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-lg font-semibold text-foreground">{stats.newThisMonth}</div>
              <div className="text-xs text-muted-foreground">Ce mois</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
