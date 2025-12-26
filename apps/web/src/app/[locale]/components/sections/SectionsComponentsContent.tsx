/**
 * Sections Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Hero, Features, TechStack, Stats, CTA } from '@/components/sections';

export default function SectionsComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants Sections"
        description="Composants de sections réutilisables pour les pages marketing"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Sections' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Hero Section">
          <div className="border rounded-lg overflow-hidden">
            <Hero />
          </div>
        </Section>

        <Section title="Features Section">
          <div className="border rounded-lg overflow-hidden">
            <Features />
          </div>
        </Section>

        <Section title="Tech Stack Section">
          <div className="border rounded-lg overflow-hidden">
            <TechStack />
          </div>
        </Section>

        <Section title="Stats Section">
          <div className="border rounded-lg overflow-hidden">
            <Stats />
          </div>
        </Section>

        <Section title="CTA Section">
          <div className="border rounded-lg overflow-hidden">
            <CTA />
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

