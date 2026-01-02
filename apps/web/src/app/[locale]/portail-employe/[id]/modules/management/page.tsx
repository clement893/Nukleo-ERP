/**
 * Page proxy pour le module Management dans le portail employé
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import dynamicImport from 'next/dynamic';
import { Loading } from '@/components/ui';

const ManagementPageContent = dynamicImport(
  () => import('@/app/[locale]/dashboard/management/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalManagementPage() {
  return <ManagementPageContent />;
}
