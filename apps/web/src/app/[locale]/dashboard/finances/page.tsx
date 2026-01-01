'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function FinancesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Module Finances"
        description="Gérez vos finances, facturations, rapports et comptes de dépenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Finances' },
        ]}
      />

      <div className="glass-card p-6 rounded-xl border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Module Finances
        </h2>
        <p className="text-muted-foreground">
          Bienvenue dans le Module Finances. Utilisez le menu latéral pour accéder aux différentes sections.
        </p>
      </div>
    </MotionDiv>
  );
}

export default function FinancesPage() {
  return <FinancesContent />;
}
