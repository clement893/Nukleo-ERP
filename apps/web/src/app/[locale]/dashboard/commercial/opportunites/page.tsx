'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function OpportunitesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Opportunités"
        description="Gérez vos opportunités commerciales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Opportunités' },
        ]}
      />
    </MotionDiv>
  );
}

export default function OpportunitesPage() {
  return <OpportunitesContent />;
}
