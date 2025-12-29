'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';

function EntreprisesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Entreprises"
        description="Gérez les entreprises et organisations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Entreprises' },
        ]}
      />

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground">
            Entreprises
          </h2>
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function EntreprisesPage() {
  return <EntreprisesContent />;
}
