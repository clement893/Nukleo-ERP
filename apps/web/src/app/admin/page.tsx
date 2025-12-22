'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Administration" 
        description="Panneau d'administration du système"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration' }
        ]} 
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Invitations" className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérer les invitations utilisateurs et les accès au système.
          </p>
          <Link href="/admin/invitations">
            <Button variant="primary" className="w-full">
              Gérer les invitations
            </Button>
          </Link>
        </Card>

        <Card title="Utilisateurs" className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Consulter et gérer les utilisateurs du système.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Bientôt disponible
          </Button>
        </Card>

        <Card title="Organisations" className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérer les organisations et leurs paramètres.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Bientôt disponible
          </Button>
        </Card>

        <Card title="Paramètres" className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configuration générale du système.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Bientôt disponible
          </Button>
        </Card>

        <Card title="Logs" className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Consulter les logs système et les activités.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Bientôt disponible
          </Button>
        </Card>

        <Card title="Statistiques" className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Visualiser les statistiques et métriques du système.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Bientôt disponible
          </Button>
        </Card>
      </div>

      <Section title="Statut du système" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                API Backend
              </span>
              <Badge variant="success">En ligne</Badge>
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Base de données
              </span>
              <Badge variant="success">Connectée</Badge>
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Services
              </span>
              <Badge variant="success">Opérationnels</Badge>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}

