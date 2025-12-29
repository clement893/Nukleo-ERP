'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function ProjetsListContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Projets"
        description="Gérez vos projets"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Projets', href: '/dashboard/projets' },
          { label: 'Projets' },
        ]}
      />
    </MotionDiv>
  );
}

export default function ProjetsListPage() {
  return <ProjetsListContent />;
}
