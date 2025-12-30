'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader, PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import CalendarView from '@/components/agenda/CalendarView';

function CalendrierContent() {
  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 min-h-0 space-y-4">
        <PageHeader
          title="Calendrier"
          description="Consultez votre calendrier avec les vacances, jours fériés, deadlines et événements"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Agenda', href: '/dashboard/agenda' },
            { label: 'Calendrier' },
          ]}
        />

        <CalendarView className="flex-1 min-h-0" />
      </MotionDiv>
    </PageContainer>
  );
}

export default function CalendrierPage() {
  return <CalendrierContent />;
}
