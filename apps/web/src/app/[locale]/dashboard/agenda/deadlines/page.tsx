'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function DeadlinesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Deadlines"
        description="Gérez vos deadlines"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Agenda', href: '/dashboard/agenda' },
          { label: 'Deadlines' },
        ]}
      />
    </MotionDiv>
  );
}

export default function DeadlinesPage() {
  return <DeadlinesContent />;
}
