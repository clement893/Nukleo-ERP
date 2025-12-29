'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function AbsencesVacancesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Absences/Vacances"
        description="Gérez les absences et vacances"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Agenda', href: '/dashboard/agenda' },
          { label: 'Absences/Vacances' },
        ]}
      />
    </MotionDiv>
  );
}

export default function AbsencesVacancesPage() {
  return <AbsencesVacancesContent />;
}
