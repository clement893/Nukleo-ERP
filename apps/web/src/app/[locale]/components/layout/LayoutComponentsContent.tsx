/**
 * Layout Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { logger } from '@/lib/logger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import InternalLayout from '@/components/layout/InternalLayout';
import LoadingState from '@/components/layout/LoadingState';
import ErrorState from '@/components/layout/ErrorState';
import ExampleCard from '@/components/layout/ExampleCard';
import PageNavigation from '@/components/layout/PageNavigation';
import { Card } from '@/components/ui';

export default function LayoutComponentsContent() {

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Layout"
        description="Composants pour la structure et la mise en page de l'application"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Layout' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Header">
          <Card className="p-0 overflow-hidden">
            <Header />
          </Card>
        </Section>

        <Section title="Footer">
          <Card className="p-0 overflow-hidden">
            <Footer />
          </Card>
        </Section>

        <Section title="Sidebar">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Sidebar provides navigation for internal pages. It automatically detects the current route and highlights the active item.
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <Sidebar />
            </div>
          </Card>
        </Section>

        <Section title="Page Navigation">
          <PageNavigation
            prev={{ label: 'Previous', href: '/components/data' }}
            next={{ label: 'Next', href: '/components/forms' }}
          />
        </Section>

        <Section title="Loading State">
          <LoadingState text="Loading content..." />
        </Section>

        <Section title="Error State">
          <ErrorState
            title="Something went wrong"
            description="Unable to load the requested content"
            onRetry={() => {
              logger.log('Retrying...');
            }}
          />
        </Section>

        <Section title="Example Card">
          <ExampleCard
            title="Example Component"
            description="This is an example card component used for showcasing components"
          >
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              <code>{`<ExampleCard
  title="Example"
  description="Description"
/>`}</code>
            </pre>
          </ExampleCard>
        </Section>

        <Section title="Internal Layout">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              InternalLayout provides a consistent layout structure for internal pages with header, sidebar, and content area.
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <InternalLayout>
                <div className="p-4 bg-muted rounded">
                  <p className="text-sm">Content area</p>
                </div>
              </InternalLayout>
            </div>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}

