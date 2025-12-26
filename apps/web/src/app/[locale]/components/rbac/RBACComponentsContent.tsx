/**
 * RBAC Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { RBACDemo } from '@/components/rbac';

export default function RBACComponentsContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants RBAC"
        description="Composants pour la gestion des rôles et permissions (Role-Based Access Control)"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'RBAC' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="RBAC Demo">
          <div className="max-w-4xl">
            <RBACDemo />
          </div>
        </Section>

        <Section title="RBAC Features">
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Role Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gestion des rôles utilisateur avec permissions granulaires.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Permission Checks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vérification des permissions pour contrôler l'accès aux fonctionnalités.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Protected Routes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Routes protégées basées sur les rôles et permissions.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">UI Components</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Composants UI qui respectent les permissions utilisateur.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

