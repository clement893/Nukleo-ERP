/**
 * Page proxy pour Événements dans le portail employé
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui';

const EventsPageContent = dynamic(
  () => import('@/app/[locale]/dashboard/agenda/evenements/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalEventsPage() {
  return <EventsPageContent />;
}
