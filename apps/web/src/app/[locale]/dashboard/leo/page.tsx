/**
 * Leo Page
 * Main page for Leo AI assistant
 */

'use client';

import { PageHeader, PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { LeoContainer } from '@/components/leo';

export default function LeoPage() {
  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 min-h-0">
        <PageHeader
          title="Leo - Assistant IA"
          description="Posez vos questions à Leo, votre assistant intelligent pour l'ERP"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Leo' },
          ]}
        />

        <div className="flex-1 min-h-0 mt-4">
          <LeoContainer />
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
