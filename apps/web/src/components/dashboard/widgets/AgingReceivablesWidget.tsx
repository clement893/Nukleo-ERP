'use client';

/**
 * Widget : Analyse Créances
 * Répartition des créances par délai (0-30j, 31-60j, 61-90j, 90j+)
 */

import { Clock, AlertTriangle, DollarSign } from 'lucide-react';
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

interface AgingData {
  bucket: string;
  amount: number;
  count: number;
  label: string;
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
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(data.payload.amount)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload.count} facture{(data.payload.count as number) !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function AgingReceivablesWidget({ }: WidgetProps) {
  const [agingData, setAgingData] = useState<AgingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await facturationsAPI.list({ limit: 1000 });
        const invoices = response.items || [];
        
        // Filter unpaid invoices (sent, partial, overdue)
        const unpaidInvoices = invoices.filter((inv: any) => 
          inv.status === 'sent' || inv.status === 'partial' || inv.status === 'overdue'
        );
        
        const now = new Date();
        const buckets: Record<string, { amount: number; count: number }> = {
          '0-30': { amount: 0, count: 0 },
          '31-60': { amount: 0, count: 0 },
          '61-90': { amount: 0, count: 0 },
          '90+': { amount: 0, count: 0 },
        };
        
        let total = 0;
        
        unpaidInvoices.forEach((invoice: any) => {
          if (!invoice.due_date) return;
          
          const dueDate = new Date(invoice.due_date);
          const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
          const amountDue = parseFloat(invoice.amount_due || invoice.total || 0);
          total += amountDue;
          
          let bucket: string;
          if (daysOverdue <= 30) {
            bucket = '0-30';
          } else if (daysOverdue <= 60) {
            bucket = '31-60';
          } else if (daysOverdue <= 90) {
            bucket = '61-90';
          } else {
            bucket = '90+';
          }
          
          buckets[bucket].amount += amountDue;
          buckets[bucket].count++;
        });
        
        setTotalAmount(total);
        
        const labels: Record<string, string> = {
          '0-30': '0-30 jours',
          '31-60': '31-60 jours',
          '61-90': '61-90 jours',
          '90+': '90+ jours',
        };
        
        const colors: Record<string, string> = {
          '0-30': '#10b981', // green
          '31-60': '#f59e0b', // amber
          '61-90': '#f97316', // orange
          '90+': '#ef4444', // red
        };
        
        const data: AgingData[] = Object.entries(buckets)
          .map(([bucket, stats]) => ({
            bucket,
            amount: stats.amount,
            count: stats.count,
            label: labels[bucket],
          }))
          .filter(item => item.amount > 0); // Only show buckets with amounts

        setAgingData(data);
      } catch (error) {
        console.error('Error loading aging receivables:', error);
        setAgingData([]);
        setTotalAmount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (agingData.length === 0 || totalAmount === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Aucune créance"
        description="Toutes les factures sont payées ou aucune facture en attente."
        variant="compact"
      />
    );
  }

  const colors: Record<string, string> = {
    '0-30': '#10b981',
    '31-60': '#f59e0b',
    '61-90': '#f97316',
    '90+': '#ef4444',
  };

  const criticalAmount = agingData.find(a => a.bucket === '90+')?.amount || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total créances</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalAmount)}
            </p>
          </div>
          {criticalAmount > 0 && (
            <div className="text-right">
              <p className="text-xs text-red-600 dark:text-red-400">90+ jours</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(criticalAmount)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={agingData}>
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
              tickFormatter={(value) =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {agingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.bucket] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
