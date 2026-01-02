/**
 * Page proxy pour le module Commercial dans le portail employé
 * Charge dynamiquement la page commerciale du dashboard principal
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui';

// Charger dynamiquement la page commerciale
const CommercialPageContent = dynamic(
  () => import('@/app/[locale]/dashboard/commercial/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalCommercialPage() {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  
  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">ID employé invalide</p>
      </div>
    );
  }
  
  return <CommercialPageContent />;
}
