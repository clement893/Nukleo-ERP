/**
 * Announcements Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { AnnouncementBanner } from '@/components/announcements';

export default function AnnouncementsComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Announcements & Banners"
        description="System announcements and banners with scheduling and targeting"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Announcements' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Announcement Banner">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Display system announcements with different types, priorities, and dismissible options.
          </p>
          <AnnouncementBanner />
        </Section>
      </div>
    </PageContainer>
  );
}



