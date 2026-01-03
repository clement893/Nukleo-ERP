'use client';

/**
 * Widget : Prévisions Financières
 * Projection des revenus et dépenses sur plusieurs mois
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface ForecastDataPoint {
  month: string;
  revenueHistorical: number;
  expenseHistorical: number;
  revenueForecast: number;
  expenseForecast: number;
  profitForecast: number;
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
              <span className="font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(entry.value as number)}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function FinancialForecastWidget({ config }: WidgetProps) {
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalForecastRevenue, setTotalForecastRevenue] = useState(0);
  const [totalForecastExpense, setTotalForecastExpense] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load historical data
        const period = (config?.period as 'month' | 'quarter' | 'year') || 'month';
        const revenueData = await fetchDashboardRevenue({ period, months: 6 });
        const expenses = await expenseAccountsAPI.list();
        
        // Group by month
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
        
        const expensesByMonth: Record<string, number> = {};
        expenses.forEach((expense: any) => {
          if (expense.expense_period_start) {
            const date = new Date(expense.expense_period_start);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(expense.total_amount || 0);
            expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
          }
        });
        
        // Calculate averages for forecast
        const revenueValues = Object.values(revenueByMonth);
        const expenseValues = Object.values(expensesByMonth);
        const avgRevenue = revenueValues.length > 0 
          ? revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length 
          : 0;
        const avgExpense = expenseValues.length > 0 
          ? expenseValues.reduce((sum, val) => sum + val, 0) / expenseValues.length 
          : 0;
        
        // Get last month
        const allMonths = Array.from(new Set([...Object.keys(revenueByMonth), ...Object.keys(expensesByMonth)])).sort();
        const lastMonth = allMonths[allMonths.length - 1] || '';
        
        // Generate forecast (last 3 historical + 6 forecast)
        const data: ForecastDataPoint[] = [];
        const now = new Date();
        
        // Historical (last 3 months)
        allMonths.slice(-3).forEach(month => {
          data.push({
            month,
            revenueHistorical: revenueByMonth[month] || 0,
            expenseHistorical: expensesByMonth[month] || 0,
            revenueForecast: 0,
            expenseForecast: 0,
            profitForecast: 0,
          });
        });
        
        // Forecast (next 6 months)
        if (lastMonth) {
          const lastDate = new Date(lastMonth + '-01');
          for (let i = 1; i <= 6; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setMonth(forecastDate.getMonth() + i);
            const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Simple forecast: use average with slight variance
            const revenueForecast = avgRevenue * (1 + (Math.random() - 0.5) * 0.1); // ±5% variance
            const expenseForecast = avgExpense * (1 + (Math.random() - 0.5) * 0.1);
            
            data.push({
              month: monthKey,
              revenueHistorical: 0,
              expenseHistorical: 0,
              revenueForecast,
              expenseForecast,
              profitForecast: revenueForecast - expenseForecast,
            });
          }
        }

        // Format month labels
        const formattedData = data.map(item => ({
          ...item,
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        }));

        setForecastData(formattedData);
        
        // Calculate totals
        const forecastOnly = formattedData.filter(d => d.revenueForecast > 0);
        const totalRev = forecastOnly.reduce((sum, d) => sum + d.revenueForecast, 0);
        const totalExp = forecastOnly.reduce((sum, d) => sum + d.expenseForecast, 0);
        setTotalForecastRevenue(totalRev);
        setTotalForecastExpense(totalExp);
      } catch (error) {
        console.error('Error loading financial forecast:', error);
        setForecastData([]);
        setTotalForecastRevenue(0);
        setTotalForecastExpense(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [config]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (forecastData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée"
        description="Les prévisions financières apparaîtront ici."
        variant="compact"
      />
    );
  }

  const netForecast = totalForecastRevenue - totalForecastExpense;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prévision revenus</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalForecastRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prévision dépenses</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalForecastExpense)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bénéfice net</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${
              netForecast >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {netForecast >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(netForecast)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
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
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="revenueHistorical"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              name="Revenus (historique)"
            />
            <Area
              type="monotone"
              dataKey="revenueForecast"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#revenueGradient)"
              name="Revenus (prévision)"
            />
            <Area
              type="monotone"
              dataKey="expenseHistorical"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              name="Dépenses (historique)"
            />
            <Area
              type="monotone"
              dataKey="expenseForecast"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#expenseGradient)"
              name="Dépenses (prévision)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
