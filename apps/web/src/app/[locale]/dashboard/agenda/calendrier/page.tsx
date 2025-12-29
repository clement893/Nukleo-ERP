'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader, PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import CalendarView from '@/components/agenda/CalendarView';

function CalendrierContent() {
  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Calendrier"
          description="Consultez votre calendrier avec les vacances, jours fériés, deadlines et événements"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Agenda', href: '/dashboard/agenda' },
            { label: 'Calendrier' },
          ]}
        />

        <CalendarView />
      </MotionDiv>
    </PageContainer>
  );
}

export default function CalendrierPage() {
  return <CalendrierContent />;
}
