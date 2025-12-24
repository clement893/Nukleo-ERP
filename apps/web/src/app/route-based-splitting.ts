/**
 * Route-Based Code Splitting Examples
 * 
 * This file demonstrates how to implement route-based code splitting
 * for better performance and smaller initial bundle sizes.
 */

import dynamic from 'next/dynamic';
import { routeSplit } from '@/lib/performance/codeSplitting';

// Example: Lazy load dashboard components
export const DashboardContent = dynamic(
  () => import('@/app/dashboard/DashboardContent'),
  {
    loading: () => <div>Loading dashboard...</div>,
    ssr: false, // Dashboard doesn't need SSR
  }
);

// Example: Lazy load admin components
export const AdminPanel = dynamic(
  () => import('@/app/admin/AdminPanel'),
  {
    loading: () => <div>Loading admin panel...</div>,
    ssr: false,
  }
);

// Example: Lazy load heavy components
export const DataTablePage = routeSplit(
  () => import('@/app/components/data/page'),
  'data'
);

export const ChartsPage = routeSplit(
  () => import('@/app/components/charts/page'),
  'charts'
);

// Example: Preload components on hover/focus
export function preloadRoute(routeName: string) {
  switch (routeName) {
    case 'dashboard':
      import('@/app/dashboard/DashboardContent');
      break;
    case 'admin':
      import('@/app/admin/AdminPanel');
      break;
    case 'data':
      import('@/app/components/data/page');
      break;
    case 'charts':
      import('@/app/components/charts/page');
      break;
  }
}

