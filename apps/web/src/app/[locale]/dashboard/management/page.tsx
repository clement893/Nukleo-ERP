'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Loading } from '@/components/ui';
import { useManagementDashboardStore } from '@/lib/management/store';
import { ManagementWidgetGrid } from '@/components/management/widgets/ManagementWidgetGrid';
import { ManagementWidgetToolbar } from '@/components/management/widgets/ManagementWidgetToolbar';

export default function ManagementPage() {
  const { loadConfig, configs } = useManagementDashboardStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const isLoading = configs.length === 0;

  if (isLoading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Management
            </h1>
            <p className="text-white/80 text-lg">
              Gérez vos employés, feuilles de temps, vacances et dépenses
            </p>
          </div>
        </div>

        {/* Widget Toolbar */}
        <ManagementWidgetToolbar />

        {/* Widget Grid */}
        <ManagementWidgetGrid />
      </MotionDiv>
    </PageContainer>
  );
}
