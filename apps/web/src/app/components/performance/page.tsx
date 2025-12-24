/**
 * Performance Components Page
 */

import PerformanceComponentsContent from './PerformanceComponentsContent';

// Force dynamic rendering to avoid CSS file issues during build
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function PerformanceComponentsPage() {
  return <PerformanceComponentsContent />;
}

