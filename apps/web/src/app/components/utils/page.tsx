'use client';

import { useState } from 'react';
import { Avatar, Tooltip, Dropdown, SearchBar, Accordion, Badge, Button } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';

export default function UtilsPage() {
  const [searchValue, setSearchValue] = useState('');

  const accordionItems = [
    { id: 'usage', title: 'Comment utiliser les composants ?', content: <p className="text-gray-600">Tous les composants sont disponibles via l'import depuis <code className="bg-gray-100 px-2 py-1 rounded">@/components/ui</code></p> },
    { id: 'customization', title: 'Personnalisation', content: <p className="text-gray-600">Chaque composant accepte une prop <code className="bg-gray-100 px-2 py-1 rounded">className</code> pour la personnalisation avec Tailwind CSS.</p> },
    { id: 'accessibility', title: 'Accessibilité', content: <p className="text-gray-600">Tous les composants incluent les attributs ARIA nécessaires pour une accessibilité optimale.</p> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Composants Utilitaires" description="Composants helpers et utilitaires pour améliorer l'expérience utilisateur" breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Utilitaires' }]} />

      <div className="space-y-8">
        <Section title="Avatar">
          <div className="flex items-center gap-6 flex-wrap">
            <Avatar src="https://i.pravatar.cc/150?img=1" name="John Doe" size="xs" />
            <Avatar src="https://i.pravatar.cc/150?img=2" name="Jane Smith" size="sm" />
            <Avatar src="https://i.pravatar.cc/150?img=3" name="Bob Johnson" size="md" />
            <Avatar src="https://i.pravatar.cc/150?img=4" name="Alice Brown" size="lg" />
            <Avatar name="Charlie Wilson" size="xl" />
            <Avatar name="John Doe" size="md" status="online" />
            <Avatar name="Jane Smith" size="md" status="away" />
            <Avatar name="Bob Johnson" size="md" status="busy" />
            <Avatar name="Alice Brown" size="md" status="offline" />
          </div>
        </Section>

        <Section title="Tooltip">
          <div className="flex gap-4 flex-wrap">
            <Tooltip content="Tooltip en haut" position="top"><Button>Survolez-moi (top)</Button></Tooltip>
            <Tooltip content="Tooltip en bas" position="bottom"><Button>Survolez-moi (bottom)</Button></Tooltip>
            <Tooltip content="Tooltip à gauche" position="left"><Button>Survolez-moi (left)</Button></Tooltip>
            <Tooltip content="Tooltip à droite" position="right"><Button>Survolez-moi (right)</Button></Tooltip>
          </div>
        </Section>

        <Section title="Dropdown">
          <div className="flex gap-4 flex-wrap">
            <Dropdown trigger={<Button variant="outline">Menu déroulant <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></Button>} items={[{ label: 'Éditer', onClick: () => alert('Éditer'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }, { label: 'Dupliquer', onClick: () => alert('Dupliquer'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> }, { divider: true }, { label: 'Supprimer', onClick: () => alert('Supprimer'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }]} />
            <Dropdown trigger={<Button variant="primary">Actions</Button>} items={[{ label: 'Option 1', onClick: () => {} }, { label: 'Option 2', onClick: () => {} }, { label: 'Option désactivée', onClick: () => {}, disabled: true }]} position="right" />
          </div>
        </Section>

        <Section title="SearchBar">
          <div className="space-y-4">
            <SearchBar placeholder="Rechercher des utilisateurs..." onSearch={(value) => setSearchValue(value)} />
            {searchValue && <p className="text-sm text-gray-600">Recherche : <strong>{searchValue}</strong></p>}
            <SearchBar placeholder="Recherche sans bouton clear" showClearButton={false} />
          </div>
        </Section>

        <Section title="Accordion">
          <Accordion items={accordionItems} allowMultiple />
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Données', href: '/components/data' }} home={{ label: 'Retour à l\'accueil', href: '/components' }} />
    </PageContainer>
  );
}
