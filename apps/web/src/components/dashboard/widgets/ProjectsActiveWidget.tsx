'use client';

/**
 * Widget : Projets Actifs
 */

import { FolderKanban, ExternalLink, AlertCircle } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

export function ProjectsActiveWidget({ config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'projects-active',
    config,
    globalFilters,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle error state - show empty state instead of error message
  // The hook now returns fallback empty data instead of throwing errors
  if (error) {
    console.warn('ProjectsActiveWidget error:', error);
  }

  const projects = data?.projects || [];

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Aucun projet actif"
        description="Créez votre premier projet pour commencer à organiser votre travail."
        variant="compact"
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'ARCHIVED':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      case 'COMPLETED':
        return 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-3">
        {projects.map((project: any) => {
          // Safely handle missing or invalid data
          const due_date = project.due_date || new Date().toISOString();
          const overdue = isOverdue(due_date);
          const progress = project.progress ?? 0;
          const status = project.status || 'ACTIVE';
          const name = project.name || 'Sans nom';
          const client = project.client || 'N/A';
          
          return (
            <Link
              key={project.id || Math.random()}
              href={`/dashboard/projets/projets/${project.id}`}
              className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {name}
                    </h4>
                    {overdue && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {client}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)} flex-shrink-0`}>
                  {status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progression</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Due date */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Échéance : {new Date(due_date).toLocaleDateString('fr-FR')}
                </span>
                {overdue && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    En retard
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {data?.total > projects.length && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/projets/projets"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Voir tous les projets ({data.total})
          </Link>
        </div>
      )}
    </div>
  );
}
