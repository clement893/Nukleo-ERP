/**
 * Page proxy pour Témoignages dans le portail employé
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import dynamicImport from 'next/dynamic';
import { Loading } from '@/components/ui';

const TestimonialsPageContent = dynamicImport(
  () => import('@/app/[locale]/dashboard/reseau/temoignages/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalTestimonialsPage() {
  return <TestimonialsPageContent />;
}
