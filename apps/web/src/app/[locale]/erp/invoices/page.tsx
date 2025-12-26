/**
 * ERP Portal - Invoices Page
 * 
 * Displays list of all invoices with filtering and pagination.
 * 
 * @module ERPInvoicesPage
 */

'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { erpPortalAPI, ERPInvoiceListResponse } from '@/lib/api/erp-portal';
import { DataTable } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * ERP Invoices Page
 * 
 * Shows paginated list of all invoices with:
 * - Invoice number
 * - Client information
 * - Amount and status
 * - Due date
 * - Payment status
 * 
 * @requires ERP_VIEW_INVOICES permission
 */
function ERPInvoicesContent() {
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useApi<ERPInvoiceListResponse>({
    url: '/v1/erp/invoices',
    params: {
      skip: 0,
      limit: pageSize,
      ...(statusFilter && { status: statusFilter }),
    },
  });

  const columns: Column<ERPInvoiceListResponse['items'][0]>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      sortable: true,
    },
    {
      key: 'client_name',
      label: 'Client',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{value || row.client_email || 'N/A'}</p>
          {row.client_email && value && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.client_email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `$${parseFloat(value as string).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === 'paid'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : value === 'open'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'invoice_date',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value) => (value ? new Date(value as string).toLocaleDateString() : '-'),
    },
  ];

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Failed to load invoices. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All Invoices
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all invoices in the system
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="open">Open</option>
            <option value="draft">Draft</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      <DataTable
        data={data?.items || []}
        columns={columns}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No invoices found"
      />
    </div>
  );
}

export default function ERPInvoicesPage() {
  return (
    <ProtectedRoute>
      <ERPInvoicesContent />
    </ProtectedRoute>
  );
}

