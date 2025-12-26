/**
 * ERP Portal - Reports Page
 * 
 * Placeholder page for reports (will be implemented when Report model exists).
 * 
 * @module ERPReportsPage
 */

'use client';

import { Card } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

/**
 * ERP Reports Page
 * 
 * Placeholder page for reports.
 * Will be fully implemented when Report model is created.
 * 
 * @requires ERP_VIEW_REPORTS permission
 */
function ERPReportsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and generate ERP reports
        </p>
      </div>

      <Card title="Coming Soon">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Reports will be available once the Report model is implemented.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            This feature is planned for a future update.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function ERPReportsPage() {
  return (
    <ProtectedRoute>
      <ERPReportsContent />
    </ProtectedRoute>
  );
}

