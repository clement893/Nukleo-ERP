'use client';

/**
 * Composant de grille drag & drop pour le dashboard du portail employé
 */

import { useMemo, useEffect, useState } from 'react';
// @ts-ignore - react-grid-layout types may not be available
import { Responsive } from 'react-grid-layout';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';
import { EmployeePortalWidgetContainer } from './EmployeePortalWidgetContainer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface EmployeePortalDashboardGridProps {
  className?: string;
}

export function EmployeePortalDashboardGrid({ className = '' }: EmployeePortalDashboardGridProps) {
  const {
    getActiveConfig,
    isEditMode,
    updateWidgetPosition,
    updateWidgetSize,
  } = useEmployeePortalDashboardStore();

  const activeConfig = getActiveConfig();
  const [, setWidth] = useState(1200);

  // Measure container width for Responsive component
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.employee-portal-dashboard-grid-container');
      if (container) {
        setWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convertir les layouts du store au format react-grid-layout
  const layouts = useMemo(() => {
    if (!activeConfig) return { lg: [], md: [], sm: [], xs: [] };

    const gridLayouts = activeConfig.layouts.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 2,
      minH: 1,
      maxW: 12,
      maxH: 4,
    }));

    return {
      lg: gridLayouts,
      md: gridLayouts.map((l: any) => ({ 
        ...l, 
        w: Math.min(l.w, 8),
        h: l.h,
      })),
      sm: gridLayouts.map((l: any) => ({ 
        ...l, 
        w: 6,
        x: 0,
        h: Math.max(l.h, 2),
      })),
      xs: gridLayouts.map((l: any) => ({ 
        ...l, 
        w: 4,
        x: 0,
        h: Math.max(l.h, 2),
      })),
    };
  }, [activeConfig]);

  // Handler pour les changements de layout
  const handleLayoutChange = (currentLayout: any, _allLayouts?: any) => {
    if (!activeConfig || !isEditMode) return;
    
    currentLayout.forEach((item: any) => {
      const widget = activeConfig.layouts.find((w) => w.id === item.i);
      if (widget) {
        if (widget.x !== item.x || widget.y !== item.y) {
          updateWidgetPosition(item.i, item.x, item.y);
        }
        if (widget.w !== item.w || widget.h !== item.h) {
          updateWidgetSize(item.i, item.w, item.h);
        }
      }
    });
  };

  if (!activeConfig || activeConfig.layouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p>Aucun widget configuré. Cliquez sur "Ajouter un widget" pour commencer.</p>
      </div>
    );
  }

  return (
    <div className={`employee-portal-dashboard-grid-container ${className}`}>
      <Responsive
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {activeConfig.layouts.map((widget) => (
          <div key={widget.id}>
            <ErrorBoundary>
              <EmployeePortalWidgetContainer
                widgetLayout={widget}
                isEditMode={isEditMode}
              />
            </ErrorBoundary>
          </div>
        ))}
      </Responsive>
    </div>
  );
}
