'use client';

/**
 * Page Dashboard Personnalisable
 */

import { useEffect, useState } from 'react';
import { useMainDashboard } from '@/hooks/useMainDashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import type { DashboardConfig } from '@/lib/dashboard/types';

export default function PersonnalisablePage() {
  const { configs, addConfig, setActiveConfig } = useMainDashboard();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Initialiser avec une configuration par défaut si aucune n'existe
  useEffect(() => {
    if (configs.length === 0) {
      const defaultConfig: DashboardConfig = {
        id: 'default',
        name: 'Mon Dashboard',
        is_default: true,
        layouts: [
          {
            id: 'widget-1',
            widget_type: 'opportunities-list',
            x: 0,
            y: 0,
            w: 4,
            h: 2,
            config: { period: 'month' },
          },
          {
            id: 'widget-2',
            widget_type: 'clients-count',
            x: 4,
            y: 0,
            w: 2,
            h: 1,
            config: { period: 'month' },
          },
          {
            id: 'widget-3',
            widget_type: 'projects-active',
            x: 6,
            y: 0,
            w: 4,
            h: 2,
            config: { period: 'month' },
          },
          {
            id: 'widget-4',
            widget_type: 'revenue-chart',
            x: 0,
            y: 2,
            w: 6,
            h: 2,
            config: { period: 'month' },
          },
          {
            id: 'widget-5',
            widget_type: 'kpi-custom',
            x: 6,
            y: 2,
            w: 2,
            h: 1,
            config: { period: 'month' },
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addConfig(defaultConfig);
      setActiveConfig(defaultConfig.id);
    }
  }, [configs.length, addConfig, setActiveConfig]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <DashboardToolbar onAddWidget={() => setIsLibraryOpen(true)} />

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <DashboardGrid />
      </div>

      {/* Widget Library Modal */}
      <WidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </div>
  );
}
