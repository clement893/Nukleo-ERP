'use client';

/**
 * Widget : Analyse Seuil de Rentabilité
 * Calcul et visualisation du point de rentabilité
 */

import { Target } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface BreakEvenData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  cumulativeProfit: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm mb-1">
            <span style={{ color: entry.color }}>●</span>{' '}
            <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {entry.value?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) || '0 €'}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function BreakEvenAnalysisWidget({ }: WidgetProps) {
  const [breakEvenData, setBreakEvenData] = useState<BreakEvenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [breakEvenPoint, setBreakEvenPoint] = useState<number | null>(null);
  const [averageMonthlyExpenses, setAverageMonthlyExpenses] = useState(0);
  const [currentProfit, setCurrentProfit] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get revenue data (last 6 months)
        const revenueResponse = await fetchDashboardRevenue({ months: 6 });
        const revenueData = revenueResponse.data || [];
        
        // Get expenses
        const expenses = await expenseAccountsAPI.list();
        
        // Calculate monthly expenses
        const monthlyExpenses: Record<string, number> = {};
        
        expenses.forEach((expense: any) => {
          if (expense.date) {
            const expenseDate = new Date(expense.date);
            const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
            monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + (expense.amount || 0);
          }
        });
        
        // Combine revenue and expenses by month
        const combined: BreakEvenData[] = [];
        let cumulativeProfit = 0;
        
        revenueData.forEach((rev: any) => {
          const monthKey = rev.month || '';
          const revenue = rev.value || 0;
          const expenses = monthlyExpenses[monthKey] || 0;
          const profit = revenue - expenses;
          cumulativeProfit += profit;
          
          combined.push({
            month: formatMonthLabel(monthKey),
            revenue,
            expenses,
            profit,
            cumulativeProfit,
          });
        });
        
        // Sort by month
        combined.sort((a, b) => {
          const monthA = a.month.split(' ')[0];
          const monthB = b.month.split(' ')[0];
          if (monthA && monthB) {
            return monthA.localeCompare(monthB);
          }
          return 0;
        });
        
        setBreakEvenData(combined);
        
        // Calculate break-even point (where cumulative profit becomes positive)
        if (combined.length > 0) {
          const lastMonth = combined[combined.length - 1];
          if (lastMonth) {
            setCurrentProfit(lastMonth.cumulativeProfit);
            
            // Find break-even point (simplified: estimate based on average)
            const avgExpenses = combined.reduce((sum, d) => sum + d.expenses, 0) / combined.length;
            const avgRevenue = combined.reduce((sum, d) => sum + d.revenue, 0) / combined.length;
            
            // Break-even is when revenue >= expenses (simplified calculation)
            if (avgRevenue > 0 && avgExpenses > 0) {
              // Estimate months to break-even if currently negative
              if (lastMonth.cumulativeProfit < 0) {
                const monthlyProfit = avgRevenue - avgExpenses;
                if (monthlyProfit > 0) {
                  const monthsToBreakEven = Math.ceil(Math.abs(lastMonth.cumulativeProfit) / monthlyProfit);
                  setBreakEvenPoint(monthsToBreakEven);
                }
              } else {
              setBreakEvenPoint(0); // Already past break-even
            }
          }
        }
      } catch (error) {
        console.error('Error loading break-even analysis:', error);
        setBreakEvenData([]);
        setAverageMonthlyExpenses(0);
        setCurrentProfit(0);
        setBreakEvenPoint(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatMonthLabel = (monthKey: string): string => {
    if (!monthKey) return 'N/A';
    const parts = monthKey.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const month = parts[1];
      if (year && month) {
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }
    }
    return monthKey;
  };

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (breakEvenData.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Aucune donnée"
        description="Les données d'analyse du seuil de rentabilité apparaîtront ici."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Profit cumulé</p>
            <p className={`text-2xl font-bold ${
              currentProfit >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {currentProfit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          {breakEvenPoint !== null && breakEvenPoint > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Jusqu'au seuil</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {breakEvenPoint} mois
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={breakEvenData}>
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine yAxisId="left" y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenus" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" name="Dépenses" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Profit cumulé"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
