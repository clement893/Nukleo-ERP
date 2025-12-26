/**
 * ERP Portal - Clients Page
 * 
 * Displays list of all clients with filtering and pagination.
 * 
 * @module ERPClientsPage
 */

'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { erpPortalAPI, ERPClientListResponse } from '@/lib/api/erp-portal';
import { DataTable } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * ERP Clients Page
 * 
 * Shows paginated list of all clients with:
 * - Client name and email
 * - Company information
 * - Total orders and spending
 * - Active status
 * 
 * @requires ERP_VIEW_CLIENTS permission
 */
function ERPClientsContent() {
  const pageSize = 10;
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  const { data, isLoading, error } = useApi<ERPClientListResponse>({
    url: '/v1/erp/clients',
    params: {
      skip: 0,
      limit: pageSize,
      ...(activeFilter !== null && { is_active: activeFilter }),
    },
  });

  const columns: Column<ERPClientListResponse['items'][0]>[] = [
    {
      key: 'name',
      label: 'Client Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{value as string}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Company',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'total_orders',
      label: 'Orders',
      sortable: true,
      render: (value) => (value as number).toString(),
    },
    {
      key: 'total_spent',
      label: 'Total Spent',
      sortable: true,
      render: (value) => `$${parseFloat(value as string).toFixed(2)}`,
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Failed to load clients. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All Clients
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all clients in the system
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={activeFilter === null ? '' : activeFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setActiveFilter(val === '' ? null : val === 'true');
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Clients</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      <DataTable
        data={data?.items || []}
        columns={columns}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No clients found"
      />
    </div>
  );
}

export default function ERPClientsPage() {
  return (
    <ProtectedRoute>
      <ERPClientsContent />
    </ProtectedRoute>
  );
}

