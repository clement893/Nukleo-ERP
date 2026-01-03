'use client';

/**
 * Widget : Répartition des Employés par Rôle
 * Répartition des employés par job_title/rôle
 */

import { UserCircle } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RoleData {
  role: string;
  count: number;
  percentage: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.role}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.value} employé{(data.value as number) !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.percentage?.toFixed(1) || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export function EmployeesByRoleWidget({ }: WidgetProps) {
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        
        // Filter active employees
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        setTotal(activeEmployees.length);
        
        // Group by job_title (used as role)
        const grouped: Record<string, number> = {};
        activeEmployees.forEach((employee: any) => {
          const role = employee.job_title || 'Non spécifié';
          grouped[role] = (grouped[role] || 0) + 1;
        });

        // Convert to array with percentages
        const data: RoleData[] = Object.entries(grouped)
          .map(([role, count]) => ({
            role,
            count,
            percentage: activeEmployees.length > 0 ? (count / activeEmployees.length) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setRoleData(data);
      } catch (error) {
        console.error('Error loading employees by role:', error);
        setRoleData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (roleData.length === 0 || total === 0) {
    return (
      <EmptyState
        icon={UserCircle}
        title="Aucune donnée"
        description="Les données de répartition par rôle apparaîtront ici."
        variant="compact"
      />
    );
  }

  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#6b7280', // gray-500
  ];

  const chartData = roleData.map(item => ({
    role: item.role,
    value: item.count,
    percentage: item.percentage,
  }));

  const COLORS = chartData.map((_, index) => colors[index % colors.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total employés actifs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Rôles</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{roleData.length}</p>
          </div>
        </div>
      </div>

      {/* Chart - Use BarChart for better readability */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              type="category"
              dataKey="role"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs max-h-24 overflow-y-auto">
          {roleData.slice(0, 8).map((item, index) => (
            <div key={item.role} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-600 dark:text-gray-400 truncate">{item.role}</span>
              <span className="ml-auto font-semibold text-gray-900 dark:text-white">
                {item.count}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({item.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
