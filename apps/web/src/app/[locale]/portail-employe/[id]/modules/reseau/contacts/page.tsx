/**
 * Page proxy pour Contacts dans le portail employé
 */
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui';

const ContactsPageContent = dynamic(
  () => import('@/app/[locale]/dashboard/reseau/contacts/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    ),
  }
);

export default function EmployeePortalContactsPage() {
  return <ContactsPageContent />;
}
