'use client';

/**
 * Widget : Trésorerie
 */

import { DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import EmptyState from '@/components/ui/EmptyState';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { useEffect, useState } from 'react';

export function CashFlowWidget({ config, globalFilters }: WidgetProps) {
  const [cashFlow, setCashFlow] = useState<{ month: string; income: number; expenses: number; net: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load revenue
        const revenueData = await fetchDashboardRevenue({
          period: (config?.period as any) || 'month',
          months: 6,
        });
        
        // Load expenses
        const expenses = await expenseAccountsAPI.list();
        
        // Group revenue by month
        const revenueByMonth: Record<string, number> = {};
        if (revenueData?.data) {
          revenueData.data.forEach((item: any) => {
            const monthKey = item.month || item.date || '';
            if (monthKey) {
              revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (item.amount || item.revenue || 0);
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
        const combined = Array.from(allMonths)
          .map(month => ({
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            income: revenueByMonth[month] || 0,
            expenses: expensesByMonth[month] || 0,
            net: (revenueByMonth[month] || 0) - (expensesByMonth[month] || 0),
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);
        
        setCashFlow(combined);
        setTotalIncome(combined.reduce((sum, item) => sum + item.income, 0));
        setTotalExpenses(combined.reduce((sum, item) => sum + item.expenses, 0));
      } catch (error) {
        console.error('Error loading cash flow:', error);
        setCashFlow([]);
        setTotalIncome(0);
        setTotalExpenses(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [config?.period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cashFlow.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée"
        description="Les données de trésorerie apparaîtront ici."
        variant="compact"
      />
    );
  }

  const netCashFlow = totalIncome - totalExpenses;
  const maxValue = Math.max(...cashFlow.map(item => Math.max(item.income, item.expenses)), 1);

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Revenus</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Dépenses</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${
            netCashFlow >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {netCashFlow >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(Math.abs(netCashFlow))}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-2">
        {cashFlow.map((item, index) => {
          const incomeHeight = (item.income / maxValue) * 100;
          const expensesHeight = (item.expenses / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-1" style={{ height: '80px' }}>
                <div
                  className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                  style={{ height: `${incomeHeight}%`, minHeight: '2px' }}
                  title={`Revenus: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.income)}`}
                />
                <div
                  className="flex-1 bg-red-500 rounded-t transition-all hover:bg-red-600"
                  style={{ height: `${expensesHeight}%`, minHeight: '2px' }}
                  title={`Dépenses: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.expenses)}`}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
