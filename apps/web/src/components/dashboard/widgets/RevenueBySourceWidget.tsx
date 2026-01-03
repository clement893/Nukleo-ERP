'use client';

/**
 * Widget : Revenus par Source
 * Répartition des revenus par source/catégorie
 */

import { DollarSign, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { facturationsAPI } from '@/lib/api/finances/facturations';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SourceData {
  source: string;
  amount: number;
  count: number;
  percentage: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.source}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(data.payload.amount)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.count} facture{(data.payload.count as number) !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.percentage?.toFixed(1) || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueBySourceWidget({ }: WidgetProps) {
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load invoices to determine revenue sources
        const invoicesResponse = await facturationsAPI.list({ limit: 1000 });
        const invoices = invoicesResponse.items || [];
        
        // Group by project (as source) - if no project, use "Sans projet"
        const grouped: Record<string, { amount: number; count: number }> = {};
        let total = 0;
        
        invoices.forEach((invoice: any) => {
          const source = invoice.project_id ? `Projet ${invoice.project_id}` : 'Sans projet';
          const amount = parseFloat(invoice.total || 0);
          total += amount;
          
          if (!grouped[source]) {
            grouped[source] = { amount: 0, count: 0 };
          }
          grouped[source].amount += amount;
          grouped[source].count++;
        });

        setTotalRevenue(total);
        
        // Convert to array with percentages
        const data: SourceData[] = Object.entries(grouped)
          .map(([source, stats]) => ({
            source,
            amount: stats.amount,
            count: stats.count,
            percentage: total > 0 ? (stats.amount / total) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 8); // Top 8 sources

        setSourceData(data);
      } catch (error) {
        console.error('Error loading revenue by source:', error);
        setSourceData([]);
        setTotalRevenue(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (sourceData.length === 0 || totalRevenue === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée"
        description="Les données de revenus par source apparaîtront ici."
        variant="compact"
      />
    );
  }

  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ];

  const chartData = sourceData.map(item => ({
    source: item.source,
    amount: item.amount,
    count: item.count,
    percentage: item.percentage,
  }));

  const COLORS = chartData.map((_, index) => colors[index % colors.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenu total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sources</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {sourceData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart - Use BarChart for better readability */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
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
            <YAxis
              type="category"
              dataKey="source"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
