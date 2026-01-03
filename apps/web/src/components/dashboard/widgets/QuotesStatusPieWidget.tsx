'use client';

/**
 * Widget : Répartition des Devis par Statut
 * PieChart des devis (acceptés, en attente, refusés)
 */

import { FileText } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { quotesAPI } from '@/lib/api/quotes';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

export function QuotesStatusPieWidget({ }: WidgetProps) {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [acceptanceRate, setAcceptanceRate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const quotes = await quotesAPI.list();
        
        // Group by status
        const grouped: Record<string, number> = {};
        quotes.forEach((quote: any) => {
          const status = quote.status || 'PENDING';
          grouped[status] = (grouped[status] || 0) + 1;
        });

        const totalCount = Object.values(grouped).reduce((sum, count) => sum + count, 0);
        setTotal(totalCount);

        // Calculate acceptance rate
        const accepted = grouped['ACCEPTED'] || 0;
        const acceptance = totalCount > 0 ? (accepted / totalCount) * 100 : 0;
        setAcceptanceRate(acceptance);

        // Convert to array with percentages
        const data: StatusData[] = Object.entries(grouped).map(([status, count]) => ({
          status,
          count,
          percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
        }));

        setStatusData(data);
      } catch (error) {
        console.error('Error loading quotes status:', error);
        setStatusData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (total === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Aucun devis"
        description="Créez votre premier devis pour voir la répartition."
        variant="compact"
      />
    );
  }

  const statusLabels: Record<string, string> = {
    'ACCEPTED': 'Acceptés',
    'PENDING': 'En attente',
    'REJECTED': 'Refusés',
    'DRAFT': 'Brouillons',
    'SENT': 'Envoyés',
  };

  const statusColors: Record<string, string> = {
    'ACCEPTED': '#10b981', // green-500
    'PENDING': '#eab308', // yellow-500
    'REJECTED': '#ef4444', // red-500
    'DRAFT': '#6b7280', // gray-500
    'SENT': '#3b82f6', // blue-500
  };

  const chartData = statusData.map(item => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    fill: statusColors[item.status] || '#6b7280',
  }));

  const COLORS = chartData.map(item => item.fill);

  return (
    <div className="h-full flex flex-col">
      {/* Header with acceptance rate */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taux d'acceptation</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {acceptanceRate.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total devis</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {data.value} devis
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {total > 0 ? (((data.value as number) / total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
