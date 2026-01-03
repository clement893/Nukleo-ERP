'use client';

/**
 * Management Dashboard Widget Grid Component
 * Grid layout with drag & drop for management widgets
 */

import { useMemo, useEffect, useState } from 'react';
// @ts-ignore - react-grid-layout types may not be available
import { Responsive } from 'react-grid-layout';
import { useManagementDashboardStore } from '@/lib/management/store';
import { ManagementWidgetContainer } from './ManagementWidgetContainer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface ManagementWidgetGridProps {
  className?: string;
}

export function ManagementWidgetGrid({ className = '' }: ManagementWidgetGridProps) {
  const {
    configs,
    activeConfig,
    isEditMode,
    updateLayout,
  } = useManagementDashboardStore();

  const [width, setWidth] = useState(1200);

  const currentConfig = useMemo(() => {
    return configs.find(c => c.id === activeConfig) || configs[0];
  }, [configs, activeConfig]);

  // Measure container width for Responsive component
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.management-grid-container');
      if (container) {
        setWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convert layouts to react-grid-layout format
  const layouts = useMemo(() => {
    if (!currentConfig) return { lg: [], md: [], sm: [], xs: [] };

    const gridLayouts = currentConfig.layouts.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 2,
      minH: 1,
      maxW: 12,
      maxH: 6,
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
  }, [currentConfig]);

  // Handle layout changes
  const handleLayoutChange = (currentLayout: any) => {
    if (!currentConfig || !isEditMode) return;

    const updatedLayouts = currentLayout.map((item: any) => {
      const widget = currentConfig.layouts.find((w) => w.id === item.i);
      if (widget) {
        return {
          ...widget,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        };
      }
      return null;
    }).filter(Boolean);

    updateLayout(updatedLayouts);
  };

  if (!currentConfig || currentConfig.layouts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun widget configuré. Ajoutez des widgets pour commencer.</p>
      </div>
    );
  }

  return (
    <div className={`management-grid-container ${className}`}>
      <ErrorBoundary>
        <Responsive
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 0 }}
          cols={{ lg: 12, md: 8, sm: 6, xs: 4 }}
          rowHeight={120}
          width={width}
          onLayoutChange={handleLayoutChange}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          transformScale={1}
          {...({
            isDraggable: isEditMode,
            isResizable: isEditMode,
          } as any)}
        >
          {currentConfig.layouts.map((widget) => (
            <div key={widget.id} className="widget-wrapper">
              <ManagementWidgetContainer widget={widget} isEditMode={isEditMode} />
            </div>
          ))}
        </Responsive>
      </ErrorBoundary>

      <style jsx global>{`
        /* Responsive Grid Styles */
        .react-grid-layout {
          position: relative;
          transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .react-grid-layout {
            /* Increase touch target size on mobile */
            padding: 8px 0;
          }
          
          .widget-wrapper {
            /* Ensure widgets are touch-friendly */
            min-height: 200px;
          }
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
        
        .widget-wrapper {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
