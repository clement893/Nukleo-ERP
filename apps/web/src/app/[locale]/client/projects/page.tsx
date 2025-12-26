/**
 * Client Portal - Projects Page
 * 
 * Displays list of client projects with filtering and pagination.
 * 
 * @module ClientProjectsPage
 */

'use client';

import { useApi } from '@/hooks/useApi';
import { clientPortalAPI, ClientProjectListResponse } from '@/lib/api/client-portal';
import { DataTable } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * Client Projects Page
 * 
 * Shows paginated list of projects with:
 * - Project name and description
 * - Status
 * - Progress
 * - Dates
 * 
 * @requires CLIENT_VIEW_PROJECTS permission
 */
function ClientProjectsContent() {
  const pageSize = 10;

  const { data, isLoading, error } = useApi<ClientProjectListResponse>({
    url: '/v1/client/projects',
    params: {
      skip: 0,
      limit: pageSize,
    },
  });

  const columns: Column<ClientProjectListResponse['items'][0]>[] = [
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : value === 'completed'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value}%
          </span>
        </div>
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
          Failed to load projects. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Projects
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your project progress and status
        </p>
      </div>

      <DataTable
        data={data?.items || []}
        columns={columns}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No projects found"
      />
    </div>
  );
}

export default function ClientProjectsPage() {
  return (
    <ProtectedRoute>
      <ClientProjectsContent />
    </ProtectedRoute>
  );
}

