/**
 * ERP Portal Layout
 * 
 * Layout wrapper for all ERP/Employee portal pages.
 * Provides ERP-specific navigation and structure with module organization.
 * 
 * @module ERPPortalLayout
 */

import { ERPNavigation } from '@/components/erp';
import { Container } from '@/components/ui';

export default function ERPPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ERP Portal
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage orders, inventory, clients, and more
          </p>
        </div>
        <ERPNavigation />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Container>{children}</Container>
      </main>
    </div>
  );
}

