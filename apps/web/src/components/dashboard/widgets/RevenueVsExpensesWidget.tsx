'use client';

/**
 * Widget : Revenus vs Dépenses
 * Graphique comparatif avec marge brute visualisée
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
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
  Legend,
  Area,
  AreaChart,
} from 'recharts';

interface ComparisonDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revenue = payload.find((p: any) => p.dataKey === 'revenue');
    const expenses = payload.find((p: any) => p.dataKey === 'expenses');
    const profit = revenue && expenses 
      ? (revenue.value as number) - (expenses.value as number)
      : 0;
    
    if (!revenue || !expenses) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Revenus: </span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(revenue.value as number)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Dépenses: </span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(expenses.value as number)}
            </span>
          </p>
          <p className={`text-sm font-bold border-t pt-1 mt-1 ${
            profit >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            Marge: {profit >= 0 ? '+' : ''}
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(profit)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueVsExpensesWidget({ config }: WidgetProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load revenue
        const period = (config?.period as 'month' | 'quarter' | 'year') || 'month';
        const revenueData = await fetchDashboardRevenue({ period, months: 6 });
        
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
        
        // Combine data
        const allMonths = new Set([...Object.keys(revenueByMonth), ...Object.keys(expensesByMonth)]);
        const combined: ComparisonDataPoint[] = Array.from(allMonths)
          .map(month => {
            const revenue = revenueByMonth[month] || 0;
            const expense = expensesByMonth[month] || 0;
            return {
              month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
              revenue,
              expenses: expense,
              profit: revenue - expense,
            };
          })
          .sort((a, b) => {
            const dateA = new Date(a.month.split(' ')[1] + '-' + a.month.split(' ')[0]);
            const dateB = new Date(b.month.split(' ')[1] + '-' + b.month.split(' ')[0]);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(-6);
        
        setComparisonData(combined);
        
        const totalRev = combined.reduce((sum, item) => sum + item.revenue, 0);
        const totalExp = combined.reduce((sum, item) => sum + item.expenses, 0);
        setTotalRevenue(totalRev);
        setTotalExpenses(totalExp);
        setNetProfit(totalRev - totalExp);
      } catch (error) {
        console.error('Error loading revenue vs expenses:', error);
        setComparisonData([]);
        setTotalRevenue(0);
        setTotalExpenses(0);
        setNetProfit(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [config]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (comparisonData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée"
        description="Les données de revenus et dépenses apparaîtront ici."
        variant="compact"
      />
    );
  }

  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const isPositive = netProfit >= 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenus</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Dépenses</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Marge nette</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(netProfit)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ({profitMargin.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={comparisonData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              tickFormatter={(value) =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              name="Revenus"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#expensesGradient)"
              name="Dépenses"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Marge"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
