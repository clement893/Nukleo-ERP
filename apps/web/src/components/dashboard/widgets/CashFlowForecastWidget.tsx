'use client';

/**
 * Widget : Prévision de Trésorerie
 * Projection de trésorerie sur plusieurs mois avec identification des périodes de tension
 */

import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
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
  actual: number;
  forecast: number;
  minForecast: number;
  maxForecast: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const actual = payload.find((p: any) => p.dataKey === 'actual');
    const forecast = payload.find((p: any) => p.dataKey === 'forecast');
    const minForecast = payload.find((p: any) => p.dataKey === 'minForecast');
    const maxForecast = payload.find((p: any) => p.dataKey === 'maxForecast');
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {actual && (
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Réel: </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(actual.value as number)}
              </span>
            </p>
          )}
          {forecast && (
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Prévision: </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(forecast.value as number)}
              </span>
            </p>
          )}
          {minForecast && maxForecast && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fourchette: {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(minForecast.value as number)} - {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(maxForecast.value as number)}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function CashFlowForecastWidget({ config }: WidgetProps) {
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCash, setCurrentCash] = useState(0);
  const [lowPoints, setLowPoints] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load historical revenue
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
        
        // Calculate historical cash flow
        const historicalMonths = Object.keys(revenueByMonth).sort();
        const historical: Array<{ month: string; cash: number }> = [];
        let cumulativeCash = 0;
        
        historicalMonths.forEach(month => {
          const revenue = revenueByMonth[month] || 0;
          const expense = expensesByMonth[month] || 0;
          cumulativeCash += revenue - expense;
          historical.push({
            month,
            cash: cumulativeCash,
          });
        });
        
        // Calculate average monthly change for forecast
        const changes: number[] = [];
        for (let i = 1; i < historical.length; i++) {
          changes.push(historical[i].cash - historical[i - 1].cash);
        }
        const avgChange = changes.length > 0 
          ? changes.reduce((sum, change) => sum + change, 0) / changes.length 
          : 0;
        
        const currentMonth = historical[historical.length - 1];
        setCurrentCash(currentMonth?.cash || 0);
        
        // Generate forecast for next 6 months
        const forecast: ForecastDataPoint[] = [];
        const lastHistoricalMonth = historical[historical.length - 1];
        if (lastHistoricalMonth) {
          let forecastCash = lastHistoricalMonth.cash;
          
          for (let i = 1; i <= 6; i++) {
            const forecastDate = new Date(lastHistoricalMonth.month + '-01');
            forecastDate.setMonth(forecastDate.getMonth() + i);
            const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Simple forecast: apply average change with some variance
            const variance = avgChange * 0.2; // 20% variance
            forecastCash += avgChange;
            
            forecast.push({
              month: forecastDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
              actual: i === 1 ? forecastCash : NaN, // First month might be partial
              forecast: forecastCash,
              minForecast: forecastCash - variance,
              maxForecast: forecastCash + variance,
            });
          }
        }
        
        // Combine historical (last 3 months) with forecast
        const last3Historical = historical.slice(-3).map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          actual: item.cash,
          forecast: NaN,
          minForecast: NaN,
          maxForecast: NaN,
        }));
        
        const combined = [...last3Historical, ...forecast];
        setForecastData(combined);
        
        // Identify low points (cash < 0 or very low)
        const lowPointIndices: number[] = [];
        combined.forEach((point, index) => {
          const cash = point.actual || point.forecast;
          if (cash < 0 || cash < 10000) {
            lowPointIndices.push(index);
          }
        });
        setLowPoints(lowPointIndices);
      } catch (error) {
        console.error('Error loading cash flow forecast:', error);
        setForecastData([]);
        setCurrentCash(0);
        setLowPoints([]);
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
        description="Les prévisions de trésorerie apparaîtront ici."
        variant="compact"
      />
    );
  }

  const isPositive = currentCash >= 0;
  const hasLowPoints = lowPoints.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Trésorerie actuelle</p>
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
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(currentCash)}
            </p>
          </div>
          {hasLowPoints && (
            <div className="text-right">
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {lowPoints.length} période{lowPoints.length !== 1 ? 's' : ''} à risque
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="forecastRangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
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
              dataKey="maxForecast"
              stroke="none"
              fill="url(#forecastRangeGradient)"
              name="Fourchette prévision"
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#forecastGradient)"
              name="Prévision"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={3}
              name="Réel"
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
