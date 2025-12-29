'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';

function AgendaContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Module Agenda"
        description="Gérez votre calendrier, événements, absences/vacances et deadlines"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Agenda' },
        ]}
      />

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Module Agenda
          </h2>
          <p className="text-muted-foreground">
            Bienvenue dans le Module Agenda. Utilisez le menu latéral pour accéder aux différentes sections.
          </p>
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function AgendaPage() {
  return <AgendaContent />;
}
