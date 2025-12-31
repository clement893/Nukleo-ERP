'use client';

/**
 * Composant de grille drag & drop pour le dashboard
 */

import { useMemo } from 'react';
import { Responsive, Layout, Layouts } from 'react-grid-layout';
// @ts-ignore - WidthProvider is not properly typed in react-grid-layout
import WidthProvider from 'react-grid-layout/lib/components/WidthProvider';
import { useDashboardStore } from '@/lib/dashboard/store';
import { WidgetContainer } from './WidgetContainer';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  className?: string;
}

export function DashboardGrid({ className = '' }: DashboardGridProps) {
  const {
    getActiveConfig,
    isEditMode,
    updateWidgetPosition,
    updateWidgetSize,
  } = useDashboardStore();

  const activeConfig = getActiveConfig();

  // Convertir les layouts du store au format react-grid-layout
  const layouts = useMemo((): Layouts => {
    if (!activeConfig) return { lg: [], md: [], sm: [], xs: [] };

    const gridLayouts: Layout[] = activeConfig.layouts.map((widget) => ({
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
      md: gridLayouts.map(l => ({ ...l, w: Math.min(l.w, 8) })),
      sm: gridLayouts.map(l => ({ ...l, w: Math.min(l.w, 6), x: 0 })),
      xs: gridLayouts.map(l => ({ ...l, w: 4, x: 0 })),
    };
  }, [activeConfig]);

  // Handler pour les changements de layout
  const handleLayoutChange = (currentLayout: Layout[]) => {
    if (!isEditMode || !activeConfig) return;

    currentLayout.forEach((item) => {
      const widget = activeConfig.layouts.find((w) => w.id === item.i);
      if (widget && (widget.x !== item.x || widget.y !== item.y)) {
        updateWidgetPosition(item.i, item.x, item.y);
      }
      if (widget && (widget.w !== item.w || widget.h !== item.h)) {
        updateWidgetSize(item.i, item.w, item.h);
      }
    });
  };

  if (!activeConfig || activeConfig.layouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun widget sur ce dashboard
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cliquez sur "Ajouter un widget" pour commencer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 8, sm: 6, xs: 4 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {activeConfig.layouts.map((widget) => (
          <div key={widget.id} className="widget-grid-item">
            <WidgetContainer
              widgetLayout={widget}
              isEditMode={isEditMode}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      <style jsx global>{`
        .react-grid-layout {
          position: relative;
          transition: height 200ms ease;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item.resizing {
          transition: none;
          z-index: 100;
        }
        
        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 100;
          opacity: 0.8;
        }
        
        .react-grid-item.dropping {
          visibility: hidden;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.2);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 0.5rem;
          border: 2px dashed rgb(59 130 246);
        }
        
        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }
        
        .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }
        
        .react-resizable-handle-se::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid rgba(0, 0, 0, 0.4);
          border-bottom: 2px solid rgba(0, 0, 0, 0.4);
        }
        
        .widget-grid-item {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
