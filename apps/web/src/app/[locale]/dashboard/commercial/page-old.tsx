'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';

function CommercialContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Module Commercial"
        description="Gérez vos activités commerciales, contacts, entreprises et opportunités"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial' },
        ]}
      />

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Module Commercial
          </h2>
          <p className="text-muted-foreground">
            Bienvenue dans le Module Commercial. Utilisez le menu latéral pour accéder aux différentes sections.
          </p>
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function CommercialPage() {
  return <CommercialContent />;
}
