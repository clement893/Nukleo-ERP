'use client';

/**
 * Widget : Statuts des Projets
 */

import { PieChart } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/lib/api/projects';
import { useEffect, useState } from 'react';

export function ProjectsStatusWidget({ }: WidgetProps) {
  const [statusData, setStatusData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        
        // Group by status
        const grouped: Record<string, number> = {};
        projects.forEach((project: any) => {
          const status = project.status || 'UNKNOWN';
          grouped[status] = (grouped[status] || 0) + 1;
        });

        setStatusData(grouped);
      } catch (error) {
        console.error('Error loading projects status:', error);
        setStatusData({});
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  const total = Object.values(statusData).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="Aucun projet"
        description="Créez votre premier projet pour voir les statuts."
        variant="compact"
      />
    );
  }

  const statusLabels: Record<string, string> = {
    'ACTIVE': 'Actifs',
    'COMPLETED': 'Terminés',
    'ON_HOLD': 'En attente',
    'CANCELLED': 'Annulés',
    'PLANNING': 'Planification',
    'UNKNOWN': 'Non défini',
  };

  const statusColors: Record<string, string> = {
    'ACTIVE': '#10b981', // green-500
    'COMPLETED': '#3b82f6', // blue-500
    'ON_HOLD': '#eab308', // yellow-500
    'CANCELLED': '#ef4444', // red-500
    'PLANNING': '#a855f7', // purple-500
    'UNKNOWN': '#6b7280', // gray-500
  };

  const entries = Object.entries(statusData).sort((a, b) => b[1] - a[1]);

  // Calculate angles for pie chart
  let currentAngle = 0;
  const segments = entries.map(([status, count]) => {
    const percentage = (count / total) * 100;
    const angle = (count / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      status,
      count,
      percentage,
      angle,
      startAngle,
      color: statusColors[status] || '#6b7280',
      label: statusLabels[status] || status,
    };
  });

  return (
    <div className="h-full flex flex-col">
      {/* Pie chart visualization */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {segments.map((segment, index) => {
              const largeArcFlag = segment.angle > 180 ? 1 : 0;
              const x1 = 50 + 50 * Math.cos((segment.startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((segment.startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos(((segment.startAngle + segment.angle) * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin(((segment.startAngle + segment.angle) * Math.PI) / 180);

              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Projets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((segment) => (
          <div key={segment.status} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">{segment.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900 dark:text-white">{segment.count}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({segment.percentage.toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
