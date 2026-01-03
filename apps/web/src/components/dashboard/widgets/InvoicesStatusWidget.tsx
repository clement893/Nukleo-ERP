'use client';

/**
 * Widget : État des Factures
 * Répartition des factures par statut avec montants
 */

import { FileText, AlertCircle } from 'lucide-react';
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

interface StatusData {
  status: string;
  count: number;
  amount: number;
  label: string;
  percentage: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.payload.count} facture{(data.payload.count as number) !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(data.payload.amount)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.percentage?.toFixed(1) || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export function InvoicesStatusWidget({ }: WidgetProps) {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await facturationsAPI.list({ limit: 1000 });
        const invoices = response.items || [];
        
        setTotal(invoices.length);
        
        // Group by status
        const grouped: Record<string, { count: number; amount: number }> = {};
        invoices.forEach((invoice: any) => {
          const status = invoice.status || 'draft';
          if (!grouped[status]) {
            grouped[status] = { count: 0, amount: 0 };
          }
          grouped[status].count++;
          grouped[status].amount += parseFloat(invoice.total || 0);
        });

        const statusLabels: Record<string, string> = {
          'draft': 'Brouillon',
          'sent': 'Envoyée',
          'paid': 'Payée',
          'partial': 'Partielle',
          'overdue': 'En retard',
          'cancelled': 'Annulée',
        };

        const statusColors: Record<string, string> = {
          'draft': '#6b7280', // gray
          'sent': '#3b82f6', // blue
          'paid': '#10b981', // green
          'partial': '#f59e0b', // amber
          'overdue': '#ef4444', // red
          'cancelled': '#6b7280', // gray
        };

        // Convert to array with percentages
        const data: StatusData[] = Object.entries(grouped)
          .map(([status, stats]) => ({
            status,
            count: stats.count,
            amount: stats.amount,
            label: statusLabels[status] || status,
            percentage: invoices.length > 0 ? (stats.count / invoices.length) * 100 : 0,
          }))
          .sort((a, b) => {
            // Sort by priority: overdue first, then sent, paid, partial, draft, cancelled
            const order: Record<string, number> = {
              'overdue': 0,
              'sent': 1,
              'partial': 2,
              'paid': 3,
              'draft': 4,
              'cancelled': 5,
            };
            return (order[a.status] || 99) - (order[b.status] || 99);
          });

        setStatusData(data);
      } catch (error) {
        console.error('Error loading invoices status:', error);
        setStatusData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (statusData.length === 0 || total === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucune donnée"
        description="Créez des factures pour voir la répartition par statut."
        variant="compact"
      />
    );
  }

  const statusColors: Record<string, string> = {
    'draft': '#6b7280',
    'sent': '#3b82f6',
    'paid': '#10b981',
    'partial': '#f59e0b',
    'overdue': '#ef4444',
    'cancelled': '#6b7280',
  };

  const overdueCount = statusData.find(s => s.status === 'overdue')?.count || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total factures</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          {overdueCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-red-600 dark:text-red-400">En retard</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {overdueCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
