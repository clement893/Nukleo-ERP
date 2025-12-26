/**
 * ERP Portal Dashboard Page
 * 
 * Main dashboard page for ERP portal.
 * Shows comprehensive statistics and quick access to ERP modules.
 * 
 * @module ERPDashboardPage
 */

'use client';

import { ERPDashboard } from '@/components/erp';
import { Card } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

/**
 * ERP Dashboard Page
 * 
 * Displays:
 * - Dashboard statistics (orders, invoices, clients, inventory)
 * - Revenue overview
 * - Quick actions by module
 * 
 * @requires ERP_VIEW_REPORTS permission
 */
function ERPDashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ERP Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of all ERP operations and statistics.
        </p>
      </div>

      <ERPDashboard />

      <Card title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/erp/orders"
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Manage Orders
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage all orders
            </p>
          </a>
          <a
            href="/erp/invoices"
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Manage Invoices
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage all invoices
            </p>
          </a>
          <a
            href="/erp/clients"
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Manage Clients
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage all clients
            </p>
          </a>
          <a
            href="/erp/inventory"
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Manage Inventory
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage inventory
            </p>
          </a>
        </div>
      </Card>
    </div>
  );
}

export default function ERPDashboardPage() {
  return (
    <ProtectedRoute>
      <ERPDashboardContent />
    </ProtectedRoute>
  );
}

