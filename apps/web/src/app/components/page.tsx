'use client';

import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';

const categories = [
  { title: 'Formulaires', description: 'Composants pour créer des formulaires interactifs', href: '/components/forms', icon: '📝', count: 8, color: 'blue' },
  { title: 'Navigation', description: 'Composants de navigation et menus', href: '/components/navigation', icon: '🗂️', count: 4, color: 'green' },
  { title: 'Feedback', description: 'Alertes, modales, notifications et indicateurs', href: '/components/feedback', icon: '💬', count: 7, color: 'yellow' },
  { title: 'Données', description: 'Tableaux, cartes et affichage de données', href: '/components/data', icon: '📊', count: 3, color: 'purple' },
  { title: 'Utilitaires', description: 'Composants utilitaires et helpers', href: '/components/utils', icon: '🛠️', count: 6, color: 'pink' },
];

export default function ComponentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Bibliothèque de Composants"
        description="Collection complète de composants réutilisables pour construire des applications SaaS modernes"
        badge={<Badge variant="info">30+ composants disponibles</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {categories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{category.icon}</div>
                <Badge variant="default">{category.count} composants</Badge>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{category.title}</h2>
              <p className="text-gray-600">{category.description}</p>
              <div className="mt-4 text-blue-600 font-medium">Voir les exemples →</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Comment utiliser ces composants ?</h3>
        <p className="text-blue-800 mb-4">
          Tous les composants sont disponibles via l'import depuis <code className="bg-blue-100 px-2 py-1 rounded">@/components/ui</code>
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <code>{`import { Button, Input, Modal } from '@/components/ui';`}</code>
        </pre>
      </div>
    </PageContainer>
  );
}
