'use client';

/**
 * Management Widget Renderer
 * Renders the appropriate widget component based on widget type
 */

import { lazy, Suspense } from 'react';
import { Card, Loading } from '@/components/ui';
import type { ManagementWidgetConfig } from '@/lib/management/types';

// Lazy load widgets for better performance
const EmployeesStatsWidget = lazy(() => import('./widgets/EmployeesStatsWidget').then(m => ({ default: m.EmployeesStatsWidget })));
const TimeTrackingWidget = lazy(() => import('./widgets/TimeTrackingWidget').then(m => ({ default: m.TimeTrackingWidget })));
const VacationOverviewWidget = lazy(() => import('./widgets/VacationOverviewWidget').then(m => ({ default: m.VacationOverviewWidget })));
const PendingRequestsWidget = lazy(() => import('./widgets/PendingRequestsWidget').then(m => ({ default: m.PendingRequestsWidget })));
const UpcomingVacationsWidget = lazy(() => import('./widgets/UpcomingVacationsWidget').then(m => ({ default: m.UpcomingVacationsWidget })));

interface ManagementWidgetRendererProps {
  widget: ManagementWidgetConfig;
}

const WidgetLoadingFallback = () => (
  <Card className="glass-card p-6 h-full">
    <div className="flex items-center justify-center h-32">
      <Loading />
    </div>
  </Card>
);

export function ManagementWidgetRenderer({ widget }: ManagementWidgetRendererProps) {
  const renderWidget = () => {
    switch (widget.widget_type) {
      case 'employees-stats':
        return <EmployeesStatsWidget widgetId={widget.id} config={widget.config} />;
      case 'time-tracking-summary':
        return <TimeTrackingWidget widgetId={widget.id} config={widget.config} />;
      case 'vacation-overview':
        return <VacationOverviewWidget widgetId={widget.id} config={widget.config} />;
      case 'pending-requests':
        return <PendingRequestsWidget widgetId={widget.id} config={widget.config} />;
      case 'upcoming-vacations':
        return <UpcomingVacationsWidget widgetId={widget.id} config={widget.config} />;
      default:
        return (
          <Card className="glass-card p-6">
            <p className="text-muted-foreground">
              Widget type "{widget.widget_type}" non implémenté
            </p>
          </Card>
        );
    }
  };

  return (
    <Suspense fallback={<WidgetLoadingFallback />}>
      {renderWidget()}
    </Suspense>
  );
}
