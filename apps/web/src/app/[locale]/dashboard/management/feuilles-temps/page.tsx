'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function FeuillesTempsContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Feuilles de temps"
        description="Gérez les feuilles de temps"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Feuilles de temps' },
        ]}
      />
    </MotionDiv>
  );
}

export default function FeuillesTempsPage() {
  return <FeuillesTempsContent />;
}
