'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';

function OpportunitesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Opportunités"
        description="Suivez vos opportunités commerciales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Opportunités' },
        ]}
      />

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground">
            Opportunités
          </h2>
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function OpportunitesPage() {
  return <OpportunitesContent />;
}
