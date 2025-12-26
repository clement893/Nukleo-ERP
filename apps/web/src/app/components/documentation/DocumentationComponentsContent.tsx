/**
 * Documentation Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { ArticleList, ArticleViewer } from '@/components/documentation';

export default function DocumentationComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Documentation & Help"
        description="Help articles and documentation system with search and feedback"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Documentation' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Article List">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Browse documentation articles with search and category filtering.
          </p>
          <ArticleList />
        </Section>

        <Section title="Article Viewer">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View documentation articles with helpful feedback system.
          </p>
          <ArticleViewer slug="getting-started" />
        </Section>
      </div>
    </PageContainer>
  );
}



