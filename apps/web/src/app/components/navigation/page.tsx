'use client';

import { useState } from 'react';
import { Sidebar, Tabs, TabList, Tab, TabPanels, TabPanel, Pagination, Button } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';

export default function NavigationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Utilisateurs', href: '/users', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, badge: '12' },
    { label: 'Produits', href: '/products', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, children: [{ label: 'Tous les produits', href: '/products' }, { label: 'Catégories', href: '/products/categories' }, { label: 'Inventaire', href: '/products/inventory' }] },
    { label: 'Paramètres', href: '/settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Composants de Navigation" description="Composants pour créer des interfaces de navigation intuitives" breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Navigation' }]} />

      <div className="space-y-8">
        <Section title="Breadcrumbs" description="Fil d'Ariane pour la navigation">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-2">Exemple 1 : Navigation produits</div>
            <div className="text-sm text-gray-600 mb-2">Exemple 2 : Navigation dashboard</div>
          </div>
        </Section>

        <Section title="Sidebar" description="Barre latérale avec sous-menus">
          <div className="flex gap-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <Sidebar items={sidebarItems} currentPath="/users" collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
            </div>
            <div className="flex-1">
              <p className="text-gray-600 mb-4">La sidebar peut être réduite et contient des sous-menus. Cliquez sur le bouton pour réduire/étendre.</p>
              <Button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? 'Étendre' : 'Réduire'} la sidebar</Button>
            </div>
          </div>
        </Section>

        <Section title="Tabs" description="Système d'onglets">
          <Tabs defaultTab="overview">
            <TabList>
              <Tab value="overview">Vue d'ensemble</Tab>
              <Tab value="analytics">Analytiques</Tab>
              <Tab value="settings">Paramètres</Tab>
              <Tab value="disabled" disabled>Désactivé</Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="overview"><div className="p-4 bg-gray-50 rounded-lg"><h3 className="font-semibold mb-2">Vue d'ensemble</h3><p className="text-gray-600">Contenu de la vue d'ensemble. Ici vous pouvez afficher des statistiques générales.</p></div></TabPanel>
              <TabPanel value="analytics"><div className="p-4 bg-gray-50 rounded-lg"><h3 className="font-semibold mb-2">Analytiques</h3><p className="text-gray-600">Contenu des analytiques. Graphiques et métriques détaillées.</p></div></TabPanel>
              <TabPanel value="settings"><div className="p-4 bg-gray-50 rounded-lg"><h3 className="font-semibold mb-2">Paramètres</h3><p className="text-gray-600">Contenu des paramètres. Configuration et préférences.</p></div></TabPanel>
            </TabPanels>
          </Tabs>
        </Section>

        <Section title="Pagination" description="Pagination pour les listes">
          <div className="space-y-6">
            <div><p className="text-sm text-gray-600 mb-2">Pagination simple</p><Pagination currentPage={currentPage} totalPages={10} onPageChange={setCurrentPage} /></div>
            <div><p className="text-sm text-gray-600 mb-2">Avec boutons première/dernière page</p><Pagination currentPage={5} totalPages={20} onPageChange={setCurrentPage} showFirstLast maxVisible={7} /></div>
            <div><p className="text-sm text-gray-600 mb-2">Page actuelle : {currentPage}</p></div>
          </div>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Formulaires', href: '/components/forms' }} next={{ label: 'Feedback', href: '/components/feedback' }} />
    </PageContainer>
  );
}
