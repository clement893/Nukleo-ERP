'use client';

import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, StatsCard, Badge, Button } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator', status: 'active' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'pending' },
];

export default function DataPage() {
  return (
    <PageContainer>
      <PageHeader title="Composants d'Affichage de Données" description="Tableaux, cartes et composants pour afficher des données" breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Données' }]} />

      <div className="space-y-8">
        <Section title="StatsCard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Utilisateurs actifs" value="1,234" change={{ value: 12, type: 'increase', period: 'ce mois' }} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
            <StatsCard title="Revenus" value="€45,678" change={{ value: 8, type: 'increase', period: 'ce mois' }} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <StatsCard title="Commandes" value="892" change={{ value: 5, type: 'decrease', period: 'ce mois' }} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} />
            <StatsCard title="Taux de conversion" value="3.2%" change={{ value: 0.5, type: 'increase', period: 'ce mois' }} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
          </div>
        </Section>

        <Section title="Table">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader sortable>Nom</TableHeader>
                <TableHeader sortable>Email</TableHeader>
                <TableHeader>Rôle</TableHeader>
                <TableHeader>Statut</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell><Badge variant="info">{row.role}</Badge></TableCell>
                  <TableCell><Badge variant={row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'error'}>{row.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Modifier</Button>
                      <Button variant="ghost" size="sm">Supprimer</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Table avec styles alternés">
          <Table striped hover>
            <TableHead>
              <TableRow>
                <TableHeader>Produit</TableHeader>
                <TableHeader>Prix</TableHeader>
                <TableHeader>Stock</TableHeader>
                <TableHeader>Statut</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody striped hover>
              <TableRow><TableCell>Laptop Pro</TableCell><TableCell>€1,299</TableCell><TableCell>15</TableCell><TableCell><Badge variant="success">En stock</Badge></TableCell></TableRow>
              <TableRow><TableCell>Mouse Wireless</TableCell><TableCell>€29</TableCell><TableCell>0</TableCell><TableCell><Badge variant="error">Rupture</Badge></TableCell></TableRow>
              <TableRow><TableCell>Keyboard Mechanical</TableCell><TableCell>€89</TableCell><TableCell>5</TableCell><TableCell><Badge variant="warning">Stock faible</Badge></TableCell></TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="EmptyState">
          <div className="space-y-6">
            <EmptyState title="Aucun résultat trouvé" description="Essayez de modifier vos filtres de recherche pour trouver ce que vous cherchez." icon={<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} action={{ label: 'Réinitialiser les filtres', onClick: () => alert('Filtres réinitialisés') }} />
            <EmptyState title="Aucun élément créé" description="Commencez par créer votre premier élément pour voir apparaître des données ici." icon={<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} action={{ label: 'Créer un élément', onClick: () => alert('Création d\'un élément') }} />
          </div>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Feedback', href: '/components/feedback' }} next={{ label: 'Utilitaires', href: '/components/utils' }} />
    </PageContainer>
  );
}
