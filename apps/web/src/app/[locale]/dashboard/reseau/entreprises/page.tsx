'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function CompaniesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Entreprises"
        description="Gérez vos entreprises et organisations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Entreprises' },
        ]}
      />
    </MotionDiv>
  );
}

export default function CompaniesPage() {
  return <CompaniesContent />;
}
