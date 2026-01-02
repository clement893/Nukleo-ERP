/**
 * Page proxy pour le module Finances dans le portail employé
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui';

const FinancesPageContent = dynamic(
  () => import('@/app/[locale]/dashboard/finances/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalFinancesPage() {
  return <FinancesPageContent />;
}
