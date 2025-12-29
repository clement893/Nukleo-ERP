'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function EvenementsContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Événements"
        description="Gérez vos événements"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Agenda', href: '/dashboard/agenda' },
          { label: 'Événements' },
        ]}
      />
    </MotionDiv>
  );
}

export default function EvenementsPage() {
  return <EvenementsContent />;
}
