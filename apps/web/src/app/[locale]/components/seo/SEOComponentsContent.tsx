/**
 * SEO Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { SchemaMarkup } from '@/components/seo';
import { Card } from '@/components/ui';

export default function SEOComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants SEO"
        description="Composants pour l'optimisation SEO et le balisage structuré"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'SEO' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Schema Markup">
          <Card>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                SchemaMarkup injecte du JSON-LD dans le document pour améliorer le référencement SEO.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Organization Schema</h3>
                  <SchemaMarkup
                    type="organization"
                    data={{
                      name: 'Example Company',
                      url: 'https://example.com',
                      logo: 'https://example.com/logo.png',
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Schema pour les informations de l'organisation (injecté dans le head).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Website Schema</h3>
                  <SchemaMarkup
                    type="website"
                    data={{
                      name: 'Example Website',
                      url: 'https://example.com',
                      description: 'Example website description',
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Schema pour les informations du site web (injecté dans le head).
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="SEO Features">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-2">Structured Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  JSON-LD pour améliorer la compréhension par les moteurs de recherche.
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-2">Meta Tags</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gestion des balises meta pour le SEO (voir SEOManager dans CMS).
                </p>
              </div>
            </Card>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

