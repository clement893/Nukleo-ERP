'use client';

/**
 * Widget : Prévisions de Revenus
 * Projection des revenus futurs basée sur les opportunités
 */

import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
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
  historical: number;
  forecast: number;
  minForecast: number;
  maxForecast: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const historical = payload.find((p: any) => p.dataKey === 'historical');
    const forecast = payload.find((p: any) => p.dataKey === 'forecast');
    const minForecast = payload.find((p: any) => p.dataKey === 'minForecast');
    const maxForecast = payload.find((p: any) => p.dataKey === 'maxForecast');
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {historical && (
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Historique: </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(historical.value as number)}
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

export function RevenueForecastWidget({ config }: WidgetProps) {
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalForecast, setTotalForecast] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load historical revenue
        const period = (config?.period as 'month' | 'quarter' | 'year') || 'month';
        const revenueData = await fetchDashboardRevenue({ period, months: 6 });
        
        // Load opportunities for forecast
        const opportunities = await opportunitiesAPI.list();
        const activeOpportunities = opportunities.filter((opp: any) => {
          const status = opp.status?.toLowerCase() || '';
          return !status.includes('won') && !status.includes('lost') && opp.expected_close_date;
        });
        
        // Group historical revenue by month
        const historicalByMonth: Record<string, number> = {};
        if (revenueData?.data) {
          revenueData.data.forEach((item: any) => {
            const monthKey = item.month || item.date || '';
            if (monthKey) {
              const value = item.value || item.amount || 0;
              historicalByMonth[monthKey] = (historicalByMonth[monthKey] || 0) + value;
            }
          });
        }
        
        // Group opportunities by expected close month
        const opportunitiesByMonth: Record<string, number> = {};
        activeOpportunities.forEach((opp: any) => {
          if (opp.expected_close_date) {
            const closeDate = new Date(opp.expected_close_date);
            const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
            const amount = (opp.amount || 0) * ((opp.probability || 50) / 100);
            opportunitiesByMonth[monthKey] = (opportunitiesByMonth[monthKey] || 0) + amount;
          }
        });
        
        // Combine historical and forecast
        const allMonths = new Set([...Object.keys(historicalByMonth), ...Object.keys(opportunitiesByMonth)]);
        const sortedMonths = Array.from(allMonths).sort();
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const data: ForecastDataPoint[] = sortedMonths
          .filter(month => {
            // Include last 3 months of history and future months
            const monthDate = new Date(month + '-01');
            const currentMonthDate = new Date(currentMonthKey + '-01');
            const monthsDiff = (monthDate.getTime() - currentMonthDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsDiff >= -3 && monthsDiff <= 6;
          })
          .map(month => {
            const isHistorical = month <= currentMonthKey;
            const historical = isHistorical ? (historicalByMonth[month] || 0) : 0;
            const forecast = !isHistorical ? (opportunitiesByMonth[month] || 0) : 0;
            const variance = forecast * 0.2; // 20% variance
            
            return {
              month,
              historical,
              forecast,
              minForecast: forecast > 0 ? forecast - variance : 0,
              maxForecast: forecast > 0 ? forecast + variance : 0,
            };
          });

        // Format month labels
        const formattedData = data.map(item => ({
          ...item,
          month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        }));

        setForecastData(formattedData);
        
        // Calculate total forecast
        const total = formattedData.reduce((sum, d) => sum + d.forecast, 0);
        setTotalForecast(total);
      } catch (error) {
        console.error('Error loading revenue forecast:', error);
        setForecastData([]);
        setTotalForecast(0);
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
        description="Les prévisions de revenus apparaîtront ici."
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Prévision totale</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalForecast)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="forecastRangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0}/>
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
              dataKey="maxForecast"
              stroke="none"
              fill="url(#forecastRangeGradient)"
              name="Fourchette prévision"
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#forecastGradient)"
              name="Prévision"
            />
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Historique"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
