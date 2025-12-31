'use client';

/**
 * Widget : Graphique des Dépenses
 * Optimisé avec glassmorphism et gradients pour un look premium
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import EmptyState from '@/components/ui/EmptyState';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Custom Tooltip avec glassmorphism
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-tooltip px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(payload[0].value)}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          Dépenses
        </p>
      </div>
    );
  }
  return null;
};

export function ExpensesChartWidget({ }: WidgetProps) {
  const [_expenses, setExpenses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ month: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await expenseAccountsAPI.list();
        setExpenses(data || []);

        // Group by month
        const grouped: Record<string, number> = {};
        data.forEach((expense: any) => {
          if (expense.expense_date) {
            const date = new Date(expense.expense_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(expense.total_amount || 0);
            grouped[monthKey] = (grouped[monthKey] || 0) + amount;
          }
        });

        // Convert to array and sort
        const sorted = Object.entries(grouped)
          .map(([month, amount]) => ({ 
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            amount 
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6); // Last 6 months

        setChartData(sorted);
        
        // Calculate total and growth
        const totalAmount = data.reduce((sum: number, exp: any) => 
          sum + parseFloat(exp.total_amount || 0), 0
        );
        setTotal(totalAmount);
        
        if (sorted.length > 1) {
          const firstMonth = sorted[0]?.amount;
          const lastMonth = sorted[sorted.length - 1]?.amount;
          if (firstMonth !== undefined && lastMonth !== undefined) {
            setGrowth(firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0);
          }
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
        setExpenses([]);
        setChartData([]);
        setTotal(0);
        setGrowth(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune dépense"
        description="Les dépenses apparaîtront ici une fois enregistrées."
        variant="compact"
      />
    );
  }

  const isPositive = growth >= 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats avec glassmorphism */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(total)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Dépenses totales
          </p>
        </div>
        <div className="glass-badge px-3 py-2 rounded-lg flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {isPositive ? '+' : ''}{growth.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart avec gradient */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="currentColor" 
              className="text-gray-200 dark:text-gray-700"
              opacity={0.3}
            />
            <XAxis 
              dataKey="month" 
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              strokeWidth={3}
              fill="url(#expensesGradient)"
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
