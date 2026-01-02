/**
 * Page proxy pour Pipeline & Client dans le portail employé
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui';

const PipelineClientPageContent = dynamic(
  () => import('@/app/[locale]/dashboard/commercial/pipeline-client/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalPipelineClientPage() {
  return <PipelineClientPageContent />;
}
