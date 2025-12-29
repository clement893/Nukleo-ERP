'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function CalendrierContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Calendrier"
        description="Consultez votre calendrier"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Agenda', href: '/dashboard/agenda' },
          { label: 'Calendrier' },
        ]}
      />
    </MotionDiv>
  );
}

export default function CalendrierPage() {
  return <CalendrierContent />;
}
