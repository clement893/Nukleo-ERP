/**
 * Content Management Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import {
  ContentDashboard,
  PagesManager,
  PostsManager,
  MediaLibrary,
  CategoriesManager,
  TagsManager,
  TemplatesManager,
  ScheduledContentManager,
} from '@/components/content';

export default function ContentComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Gestion de Contenu"
        description="Composants pour la gestion complète de contenu CMS"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Contenu' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Content Dashboard">
          <ContentDashboard
            stats={{
              totalPages: 12,
              totalPosts: 45,
              totalMedia: 128,
              totalCategories: 8,
              totalTags: 32,
              scheduledContent: 5,
            }}
          />
        </Section>

        <Section title="Pages Manager">
          <PagesManager />
        </Section>

        <Section title="Posts Manager">
          <PostsManager />
        </Section>

        <Section title="Media Library">
          <MediaLibrary />
        </Section>

        <Section title="Categories Manager">
          <CategoriesManager />
        </Section>

        <Section title="Tags Manager">
          <TagsManager />
        </Section>

        <Section title="Templates Manager">
          <TemplatesManager />
        </Section>

        <Section title="Scheduled Content Manager">
          <ScheduledContentManager />
        </Section>

        <Section title="Content Preview">
          <p className="text-muted-foreground mb-4">
            ContentPreview requires a modal state. See component implementation for usage.
          </p>
        </Section>
      </div>
    </PageContainer>
  );
}

