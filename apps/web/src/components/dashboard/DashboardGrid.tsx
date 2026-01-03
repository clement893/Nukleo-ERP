'use client';

/**
 * Composant de grille drag & drop pour le dashboard
 */

import { useMemo, useEffect, useState } from 'react';
// @ts-ignore - react-grid-layout types may not be available
import { Responsive } from 'react-grid-layout';
import { useDashboardStore } from '@/lib/dashboard/store';
import { useDashboardContext } from '@/contexts/DashboardContext';
import { WidgetContainer } from './WidgetContainer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardGridProps {
  className?: string;
}

export function DashboardGrid({ className = '' }: DashboardGridProps) {
  const context = useDashboardContext();
  const {
    getActiveConfig,
    isEditMode,
    updateWidgetPosition,
    updateWidgetSize,
  } = useDashboardStore(context);

  const activeConfig = getActiveConfig();
  const [width, setWidth] = useState(1200);

  // Measure container width for Responsive component
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.dashboard-grid-container');
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

    // Optimized responsive layouts
    // lg (desktop): 12 cols - full layout
    // md (tablet landscape): 8 cols - slightly compressed
    // sm (tablet portrait): 6 cols - single column for most widgets
    // xs (mobile): 4 cols - full width single column
    return {
      lg: gridLayouts,
      md: gridLayouts.map((l: any) => ({ 
        ...l, 
        w: Math.min(l.w, 8),
        // Adjust height for medium screens
        h: l.h,
      })),
      sm: gridLayouts.map((l: any) => ({ 
        ...l, 
        w: 6, // Full width on tablet portrait
        x: 0,
        // Slightly increase height for better mobile UX
        h: Math.max(l.h, 2),
      })),
      xs: gridLayouts.map((l: any) => ({ 
        ...l, 
        w: 4, // Full width on mobile
        x: 0,
        // Increase height for mobile readability
        h: Math.max(l.h, 2),
      })),
    };
  }, [activeConfig]);

  // Handler pour les changements de layout
  const handleLayoutChange = (currentLayout: any, _allLayouts?: any) => {
    if (!activeConfig) return;
    
    // Permettre les changements même en mode non-édition pour la persistance
    // (react-grid-layout peut déclencher des changements lors du redimensionnement de la fenêtre)

    let hasChanges = false;
    currentLayout.forEach((item: any) => {
      const widget = activeConfig.layouts.find((w) => w.id === item.i);
      if (!widget) return;
      
      // Mettre à jour la position si elle a changé
      if (widget.x !== item.x || widget.y !== item.y) {
        hasChanges = true;
        updateWidgetPosition(item.i, item.x, item.y);
      }
      // Mettre à jour la taille si elle a changé
      if (widget.w !== item.w || widget.h !== item.h) {
        hasChanges = true;
        updateWidgetSize(item.i, item.w, item.h);
      }
    });
    
    if (hasChanges) {
      console.log('[DashboardGrid] Layout changed, saving...');
    }
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
    <div className={`dashboard-grid-container ${className}`}>
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
        {activeConfig.layouts.map((widget) => (
          <div key={widget.id} className="widget-grid-item">
            <ErrorBoundary
              fallback={
                <div className="h-full w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-center">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Erreur de chargement du widget
                  </p>
                </div>
              }
            >
              <WidgetContainer
                widgetLayout={widget}
                isEditMode={isEditMode}
              />
            </ErrorBoundary>
          </div>
        ))}
      </Responsive>

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
          
          .widget-grid-item {
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
        
        .widget-grid-item {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
