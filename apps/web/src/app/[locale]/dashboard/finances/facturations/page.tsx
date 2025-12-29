'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function FacturationsContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Facturations"
        description="Gérez vos facturations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Finances', href: '/dashboard/finances' },
          { label: 'Facturations' },
        ]}
      />
    </MotionDiv>
  );
}

export default function FacturationsPage() {
  return <FacturationsContent />;
}
