'use client';

/**
 * Widget : Nombre d'Employés
 */

import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { useEffect, useState } from 'react';

export function EmployeesCountWidget({ config, globalFilters }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        const currentCount = employees.length;
        setCount(currentCount);
        
        // Calculate previous period (last month)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const previousPeriodEmployees = employees.filter((emp: any) => {
          if (!emp.hire_date) return false;
          const hireDate = new Date(emp.hire_date);
          return hireDate < oneMonthAgo;
        });
        
        setPreviousCount(previousPeriodEmployees.length);
      } catch (error) {
        console.error('Error loading employees:', error);
        setCount(0);
        setPreviousCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const growth = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;
  const isPositive = growth >= 0;

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Count */}
        <div className="mb-2">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {count.toLocaleString('fr-FR')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Employés actifs
          </p>
        </div>

        {/* Growth */}
        {previousCount > 0 && (
          <div className="flex items-center justify-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}{growth.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              vs mois dernier
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
