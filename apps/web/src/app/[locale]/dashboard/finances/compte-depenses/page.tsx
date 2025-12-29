'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function CompteDepensesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Compte de dépenses"
        description="Gérez vos comptes de dépenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Finances', href: '/dashboard/finances' },
          { label: 'Compte de dépenses' },
        ]}
      />
    </MotionDiv>
  );
}

export default function CompteDepensesPage() {
  return <CompteDepensesContent />;
}
