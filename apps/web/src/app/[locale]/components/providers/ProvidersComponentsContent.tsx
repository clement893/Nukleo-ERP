/**
 * Providers Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Card } from '@/components/ui';

export default function ProvidersComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants Providers"
        description="Providers React pour la configuration de l'application"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Providers' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="App Providers">
          <Card>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AppProviders est un composant qui combine tous les providers nécessaires pour l'application :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>QueryClientProvider (React Query)</li>
                <li>SessionProvider (NextAuth)</li>
                <li>ThemeProvider (Gestion du thème)</li>
                <li>GlobalErrorHandler (Gestion des erreurs)</li>
              </ul>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Ce composant est généralement utilisé au niveau racine de l'application pour fournir
                tous les contextes nécessaires aux composants enfants.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Provider Components">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-2">QueryProvider</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provider pour React Query (TanStack Query) permettant la gestion des requêtes et du cache.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-2">SessionProvider</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provider pour NextAuth.js permettant la gestion des sessions utilisateur.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-2">ThemeManagerProvider</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provider pour la gestion du thème (mode sombre/clair) et des préférences utilisateur.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-2">GlobalErrorHandler</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Handler global pour la gestion des erreurs non capturées dans l'application.
                </p>
              </div>
            </Card>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

