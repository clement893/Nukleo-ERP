'use client';

/**
 * Widget : Graphique des Dépenses
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import EmptyState from '@/components/ui/EmptyState';
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
} from 'recharts';

export function ExpensesChartWidget({ }: WidgetProps) {
  const [expenses] = useState<any[]>([]);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      {/* Header stats */}
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex items-center gap-1">
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

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(value),
                'Dépenses'
              ]}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
