'use client';

/**
 * Widget : Évolution des Marges
 * Évolution du taux de marge dans le temps
 */

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface MarginDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const marginEntry = payload.find((p: any) => p.dataKey === 'margin');
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'margin') return null;
            return (
              <p key={index} className="text-sm">
                <span style={{ color: entry.color }}>●</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {entry.dataKey === 'revenue' || entry.dataKey === 'expenses' || entry.dataKey === 'profit'
                    ? new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      }).format(entry.value as number)
                    : entry.value}
                </span>
              </p>
            );
          })}
          {marginEntry && (
            <p className="text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Marge: </span>
              <span className={`font-bold ${
                (marginEntry.value as number) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {marginEntry.value?.toFixed(1) || 0}%
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function ProfitMarginChartWidget({ config }: WidgetProps) {
  const [marginData, setMarginData] = useState<MarginDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageMargin, setAverageMargin] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load revenue
        const period = (config?.period as 'month' | 'quarter' | 'year') || 'month';
        const revenueData = await fetchDashboardRevenue({ period, months: 12 });
        
        // Load expenses
        const expenses = await expenseAccountsAPI.list();
        
        // Group revenue by month
        const revenueByMonth: Record<string, number> = {};
        if (revenueData?.data) {
          revenueData.data.forEach((item: any) => {
            const monthKey = item.month || item.date || '';
            if (monthKey) {
              const value = item.value || item.amount || 0;
              revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + value;
            }
          });
        }
        
        // Group expenses by month
        const expensesByMonth: Record<string, number> = {};
        expenses.forEach((expense: any) => {
          if (expense.expense_period_start) {
            const date = new Date(expense.expense_period_start);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(expense.total_amount || 0);
            expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
          } else if (expense.created_at) {
            const date = new Date(expense.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(expense.total_amount || 0);
            expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
          }
        });
        
        // Combine and calculate margins
        const allMonths = new Set([...Object.keys(revenueByMonth), ...Object.keys(expensesByMonth)]);
        const sortedMonths = Array.from(allMonths).sort().slice(-12);
        
        const data: MarginDataPoint[] = sortedMonths.map(month => {
          const revenue = revenueByMonth[month] || 0;
          const expense = expensesByMonth[month] || 0;
          const profit = revenue - expense;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
          
          return {
            month,
            revenue,
            expenses: expense,
            profit,
            margin,
          };
        });

        // Format month labels
        const formattedData = data.map(item => ({
          ...item,
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        }));

        setMarginData(formattedData);
        
        // Calculate average margin
        if (formattedData.length > 0) {
          const avg = formattedData.reduce((sum, d) => sum + d.margin, 0) / formattedData.length;
          setAverageMargin(avg);
        }
      } catch (error) {
        console.error('Error loading profit margin chart:', error);
        setMarginData([]);
        setAverageMargin(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [config]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (marginData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée"
        description="Les données de marge apparaîtront ici."
        variant="compact"
      />
    );
  }

  const lastMargin = marginData[marginData.length - 1]?.margin || 0;
  const isPositive = lastMargin >= 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Marge moyenne</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageMargin.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Dernière marge</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {lastMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={marginData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="margin"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Marge"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
