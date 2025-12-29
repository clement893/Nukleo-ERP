'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function RapportContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Rapport"
        description="Consultez vos rapports financiers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Finances', href: '/dashboard/finances' },
          { label: 'Rapport' },
        ]}
      />
    </MotionDiv>
  );
}

export default function RapportPage() {
  return <RapportContent />;
}
