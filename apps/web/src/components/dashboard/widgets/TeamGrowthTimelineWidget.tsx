'use client';

/**
 * Widget : Évolution de l'Effectif
 * Nombre d'employés dans le temps, recrutements vs départs
 */

import { Users, TrendingUp, UserPlus, UserMinus } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { useEffect, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  ComposedChart,
} from 'recharts';

interface GrowthDataPoint {
  month: string;
  total: number;
  hires: number;
  departures: number;
  net: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>●</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
              <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function TeamGrowthTimelineWidget({ }: WidgetProps) {
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        
        setCurrentTotal(employees.length);
        
        // Group by month for hires and departures
        const hiresByMonth: Record<string, number> = {};
        const departuresByMonth: Record<string, number> = {};
        const cumulativeByMonth: Record<string, number> = {};
        
        // Process hires
        employees.forEach((employee: any) => {
          if (employee.hire_date) {
            const hireDate = new Date(employee.hire_date);
            const monthKey = `${hireDate.getFullYear()}-${String(hireDate.getMonth() + 1).padStart(2, '0')}`;
            hiresByMonth[monthKey] = (hiresByMonth[monthKey] || 0) + 1;
          }
        });
        
        // Process departures (terminated employees)
        employees.forEach((employee: any) => {
          if (employee.termination_date || employee.status === 'terminated') {
            const termDate = employee.termination_date 
              ? new Date(employee.termination_date)
              : new Date(employee.updated_at);
            const monthKey = `${termDate.getFullYear()}-${String(termDate.getMonth() + 1).padStart(2, '0')}`;
            departuresByMonth[monthKey] = (departuresByMonth[monthKey] || 0) + 1;
          }
        });
        
        // Calculate cumulative totals per month
        const allMonths = new Set([...Object.keys(hiresByMonth), ...Object.keys(departuresByMonth)]);
        let cumulativeTotal = 0;
        const sortedMonths = Array.from(allMonths).sort();
        
        sortedMonths.forEach(month => {
          cumulativeTotal += hiresByMonth[month] || 0;
          cumulativeTotal -= departuresByMonth[month] || 0;
          cumulativeByMonth[month] = cumulativeTotal;
        });
        
        // Convert to array format (last 12 months)
        const data: GrowthDataPoint[] = sortedMonths
          .slice(-12)
          .map(month => ({
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            total: cumulativeByMonth[month] || 0,
            hires: hiresByMonth[month] || 0,
            departures: departuresByMonth[month] || 0,
            net: (hiresByMonth[month] || 0) - (departuresByMonth[month] || 0),
          }));

        setGrowthData(data);
        
        // Calculate growth rate (comparing first and last month)
        if (data.length > 1) {
          const first = data[0];
          const last = data[data.length - 1];
          if (first && last) {
            const firstTotal = first.total;
            const lastTotal = last.total;
            const rate = firstTotal > 0 ? ((lastTotal - firstTotal) / firstTotal) * 100 : 0;
            setGrowthRate(rate);
          }
        }
      } catch (error) {
        console.error('Error loading team growth timeline:', error);
        setGrowthData([]);
        setCurrentTotal(0);
        setGrowthRate(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (growthData.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucune donnée"
        description="Les données d'évolution de l'effectif apparaîtront ici."
        variant="compact"
      />
    );
  }

  const isPositive = growthRate >= 0;
  const totalHires = growthData.reduce((sum, d) => sum + d.hires, 0);
  const totalDepartures = growthData.reduce((sum, d) => sum + d.departures, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Effectif actuel</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentTotal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taux de croissance</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <UserMinus className="w-5 h-5" />
              )}
              {isPositive ? '+' : ''}{growthRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Solde net</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              (totalHires - totalDepartures) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {totalHires - totalDepartures >= 0 ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <UserMinus className="w-5 h-5" />
              )}
              {totalHires - totalDepartures >= 0 ? '+' : ''}{totalHires - totalDepartures}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="right" dataKey="hires" fill="#10b981" name="Recrutements" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="departures" fill="#ef4444" name="Départs" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Effectif total"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
