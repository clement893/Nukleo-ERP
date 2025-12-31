/**
 * ERP Dashboard Component
 * 
 * Main dashboard for ERP portal showing comprehensive statistics and overview.
 * 
 * @module ERPDashboard
 */

'use client';

import { memo } from 'react';
import { ERPDashboardStats } from '@/lib/api/erp-portal';
import { Card, StatsCard } from '@/components/ui';
import { useApi } from '@/hooks/useApi';

/**
 * ERP Dashboard Component
 * 
 * Displays ERP portal dashboard with:
 * - Order statistics
 * - Invoice statistics
 * - Client statistics
 * - Inventory statistics
 * - Revenue metrics
 * - Department-specific stats (if applicable)
 * 
 * @example
 * ```tsx
 * <ERPDashboard />
 * ```
 */
export const ERPDashboard = memo(function ERPDashboard() {
  const { data: stats, isLoading, error } = useApi<ERPDashboardStats>({
    url: '/v1/erp/dashboard/stats',
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card title="Error">
        <p className="text-red-600 dark:text-red-400">
          Failed to load dashboard statistics. Please try again later.
        </p>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats.total_orders.toString()}
          className="bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800"
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pending_orders.toString()}
          className="bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800"
        />
        <StatsCard
          title="Completed Orders"
          value={stats.completed_orders.toString()}
          className="bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800"
        />
        <StatsCard
          title="Total Clients"
          value={(stats.total_clients ?? 0).toString()}
          className="bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Revenue Overview">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${parseFloat(stats.total_revenue).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Revenue</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                ${parseFloat(stats.pending_revenue).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Invoices & Clients">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Invoices</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.paid_invoices} / {stats.total_invoices}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.active_clients ?? 0} / {stats.total_clients ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory Stats */}
      {(stats.total_products > 0 || stats.low_stock_products > 0) && (
        <Card title="Inventory Status">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total_products}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className={`text-2xl font-bold ${
                stats.low_stock_products > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {stats.low_stock_products}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

