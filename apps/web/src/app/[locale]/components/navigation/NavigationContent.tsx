'use client';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';
import { Divider, Breadcrumb } from '@/components/ui';

// Dynamically import components to avoid CSS issues during build
const Sidebar = dynamicImport(() => import('@/components/ui/Sidebar').then(mod => ({ default: mod.default })), { ssr: false, loading: () => <div>Loading...</div> });
const Tabs = dynamicImport(() => import('@/components/ui/Tabs').then(mod => ({ default: mod.default })), { ssr: false, loading: () => <div>Loading...</div> });
const TabList = dynamicImport(() => import('@/components/ui/Tabs').then(mod => ({ default: mod.TabList })), { ssr: false });
const Tab = dynamicImport(() => import('@/components/ui/Tabs').then(mod => ({ default: mod.Tab })), { ssr: false });
const TabPanels = dynamicImport(() => import('@/components/ui/Tabs').then(mod => ({ default: mod.TabPanels })), { ssr: false });
const TabPanel = dynamicImport(() => import('@/components/ui/Tabs').then(mod => ({ default: mod.TabPanel })), { ssr: false });
const Pagination = dynamicImport(() => import('@/components/ui/Pagination').then(mod => ({ default: mod.default })), { ssr: false, loading: () => <div>Loading...</div> });
const Button = dynamicImport(() => import('@/components/ui/Button').then(mod => ({ default: mod.default })), { ssr: false, loading: () => <div>Loading...</div> });

export default function NavigationContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Utilisateurs', href: '/users', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, badge: '12' },
    { label: 'Produits', href: '/products', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, children: [{ label: 'Tous les produits', href: '/products' }, { label: 'CatÃ©gories', href: '/products/categories' }, { label: 'Inventaire', href: '/products/inventory' }] },
    { label: 'ParamÃ¨tres', href: '/settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Composants de Navigation" description="Composants pour créer des interfaces de navigation intuitives" breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Navigation' }]} />

      <div className="space-y-8">
        <Section title="Breadcrumb" description="Fil d'Ariane pour la navigation">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Navigation produits</h4>
              <Breadcrumb
                items={[
                  { label: 'Produits', href: '/products' },
                  { label: 'Ã‰lectronique', href: '/products/electronics' },
                  { label: 'Ordinateurs portables' },
                ]}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Navigation dashboard</h4>
              <Breadcrumb
                items={[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Administration', href: '/admin' },
                  { label: 'Paramètres', href: '/admin/settings' },
                ]}
                showHome={false}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Avec icÃ´nes</h4>
              <Breadcrumb
                items={[
                  { label: 'Administration', href: '/admin', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
                  { label: 'Utilisateurs', href: '/admin/users' },
                  { label: 'DÃ©tails' },
                ]}
              />
            </div>
          </div>
        </Section>

        <Section title="Divider" description="SÃ©parateur visuel">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Divider horizontal</h4>
              <div className="space-y-4">
                <p>Contenu au-dessus</p>
                <Divider />
                <p>Contenu en-dessous</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Divider avec label</h4>
              <Divider label="OU" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Divider avec variantes</h4>
              <div className="space-y-4">
                <Divider variant="solid" />
                <Divider variant="dashed" />
                <Divider variant="dotted" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Divider vertical</h4>
              <div className="flex items-center gap-4 h-20">
                <span>Gauche</span>
                <Divider orientation="vertical" />
                <span>Droite</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Divider avec espacements</h4>
              <div className="space-y-4">
                <p>Espacement petit</p>
                <Divider spacing="sm" />
                <p>Espacement moyen (dÃ©faut)</p>
                <Divider spacing="md" />
                <p>Espacement grand</p>
                <Divider spacing="lg" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Sidebar" description="Barre latÃ©rale avec sous-menus">
          <div className="flex gap-4">
            <div className="border border-border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <Sidebar items={sidebarItems} currentPath="/users" collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground mb-4">La sidebar peut Ãªtre rÃ©duite et contient des sous-menus. Cliquez sur le bouton pour rÃ©duire/Ã©tendre.</p>
              <Button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? 'Ã‰tendre' : 'RÃ©duire'} la sidebar</Button>
            </div>
          </div>
        </Section>

        <Section title="Tabs" description="SystÃ¨me d'onglets">
          <Tabs defaultTab="overview">
            <TabList>
              <Tab value="overview">Vue d'ensemble</Tab>
              <Tab value="analytics">Analytiques</Tab>
              <Tab value="settings">ParamÃ¨tres</Tab>
              <Tab value="disabled" disabled>DÃ©sactivÃ©</Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="overview"><div className="p-4 bg-muted rounded-lg"><h3 className="font-semibold mb-2">Vue d'ensemble</h3><p className="text-muted-foreground">Contenu de la vue d'ensemble. Ici vous pouvez afficher des statistiques gÃ©nÃ©rales.</p></div></TabPanel>
              <TabPanel value="analytics"><div className="p-4 bg-muted rounded-lg"><h3 className="font-semibold mb-2">Analytiques</h3><p className="text-muted-foreground">Contenu des analytiques. Graphiques et mÃ©triques dÃ©taillÃ©es.</p></div></TabPanel>
              <TabPanel value="settings"><div className="p-4 bg-muted rounded-lg"><h3 className="font-semibold mb-2">ParamÃ¨tres</h3><p className="text-muted-foreground">Contenu des paramÃ¨tres. Configuration et prÃ©fÃ©rences.</p></div></TabPanel>
            </TabPanels>
          </Tabs>
        </Section>

        <Section title="Pagination" description="Pagination pour les listes">
          <div className="space-y-6">
            <div><p className="text-sm text-muted-foreground mb-2">Pagination simple</p><Pagination currentPage={currentPage} totalPages={10} onPageChange={setCurrentPage} /></div>
            <div><p className="text-sm text-muted-foreground mb-2">Avec boutons premiÃ¨re/derniÃ¨re page</p><Pagination currentPage={5} totalPages={20} onPageChange={setCurrentPage} showFirstLast maxVisible={7} /></div>
            <div><p className="text-sm text-muted-foreground mb-2">Page actuelle : {currentPage}</p></div>
          </div>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Formulaires', href: '/components/forms' }} next={{ label: 'Feedback', href: '/components/feedback' }} />
    </PageContainer>
  );
}

