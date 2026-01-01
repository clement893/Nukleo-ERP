'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import CalendarViewWithBrand from '@/components/agenda/CalendarViewWithBrand';

function CalendrierContent() {
  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 min-h-0 space-y-4">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-4 pb-6">
          {/* Aurora Borealis Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          
          {/* Grain Texture Overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Calendrier
              </h1>
              <p className="text-white/80 text-lg mb-4">
                Consultez votre calendrier avec les vacances, jours fériés, deadlines et événements
              </p>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>Dashboard</span>
                <span>/</span>
                <span>Module Agenda</span>
                <span>/</span>
                <span className="text-white">Calendrier</span>
              </div>
            </div>
          </div>
        </div>

        <CalendarViewWithBrand className="flex-1 min-h-0" />
      </MotionDiv>
    </PageContainer>
  );
}

export default function CalendrierPage() {
  return <CalendrierContent />;
}
