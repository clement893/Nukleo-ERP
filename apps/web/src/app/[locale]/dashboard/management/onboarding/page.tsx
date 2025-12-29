'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';

function OnboardingContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Onboarding"
        description="Gérez l'onboarding des nouveaux employés"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Onboarding' },
        ]}
      />
    </MotionDiv>
  );
}

export default function OnboardingPage() {
  return <OnboardingContent />;
}
