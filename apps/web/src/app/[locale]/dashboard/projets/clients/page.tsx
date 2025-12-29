'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function ClientsContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Clients"
        description="Gérez vos clients"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules Opérations', href: '/dashboard/projets' },
          { label: 'Clients' },
        ]}
      />
    </MotionDiv>
  );
}

export default function ClientsPage() {
  return <ClientsContent />;
}
