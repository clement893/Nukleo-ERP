/**
 * Activity Log Component
 * Displays user activity log with filtering
 */

'use client';

import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { Filter, User, Search } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityLogProps {
  activities: ActivityLogEntry[];
  onFilterChange?: (filters: ActivityFilters) => void;
  className?: string;
}

export interface ActivityFilters {
  user?: string;
  action?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export default function ActivityLog({
  activities,
  onFilterChange,
  className,
}: ActivityLogProps) {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filters.user) {
      filtered = filtered.filter((a) => a.user.id === filters.user);
    }

    if (filters.action) {
      filtered = filtered.filter((a) => a.action === filters.action);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.action.toLowerCase().includes(term) ||
          a.resource.toLowerCase().includes(term) ||
          a.user.name.toLowerCase().includes(term) ||
          a.details?.toLowerCase().includes(term)
      );
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter((a) => {
        const date = new Date(a.timestamp);
        return date >= start && date <= end;
      });
    }

    return filtered;
  }, [activities, filters, searchTerm]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(activities.map((a) => a.action));
    return Array.from(actions);
  }, [activities]);

  const uniqueUsers = useMemo(() => {
    const users = new Map<string, { id: string; name: string }>();
    activities.forEach((a) => {
      if (!users.has(a.user.id)) {
        users.set(a.user.id, { id: a.user.id, name: a.user.name });
      }
    });
    return Array.from(users.values());
  }, [activities]);

  const columns: Column<ActivityLogEntry>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (value) => (
        <div className="text-gray-900 dark:text-gray-100">
          <div className="font-medium">
            {new Date(value as string).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(value as string).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (_, activity) => (
        <div className="flex items-center gap-2">
          <Avatar
            src={activity.user.avatar}
            name={activity.user.name}
            size="sm"
          />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {activity.user.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activity.user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (value) => (
        <Badge variant="info">{value as string}</Badge>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (value, activity) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {value as string}
          </div>
          {activity.resourceId && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              ID: {activity.resourceId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value as string || '-'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (value) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {value as string || '-'}
        </span>
      ),
    },
  ];

  return (
    <Card className={clsx('bg-white dark:bg-gray-800', className)}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <User className="w-5 h-5" />
            Activity Log
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredActivities.length} of {activities.length} entries
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                className={clsx(
                  'w-full pl-10 pr-4 py-2 border rounded-lg text-sm',
                  'bg-white dark:bg-gray-700',
                  'text-gray-900 dark:text-gray-100',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={filters.user || ''}
              onChange={(e) => {
                const newFilters = { ...filters, user: e.target.value || undefined };
                setFilters(newFilters);
                onFilterChange?.(newFilters);
              }}
              className={clsx(
                'px-3 py-2 border rounded-lg text-sm',
                'bg-white dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              <option value="">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <select
              value={filters.action || ''}
              onChange={(e) => {
                const newFilters = { ...filters, action: e.target.value || undefined };
                setFilters(newFilters);
                onFilterChange?.(newFilters);
              }}
              className={clsx(
                'px-3 py-2 border rounded-lg text-sm',
                'bg-white dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={filteredActivities as Record<string, unknown>[]}
        columns={columns}
        pageSize={20}
        emptyMessage="No activity found"
      />
    </Card>
  );
}

