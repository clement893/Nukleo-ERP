'use client';

import { useState } from 'react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState, StatsCard, Badge, Button, DataTable, DataTableEnhanced, KanbanBoard, Calendar, CRUDModal, ExportButton, Input, Timeline, List, VirtualTable, DragDropList } from '@/components/ui';
import type { KanbanCard, KanbanColumn, CalendarEvent, DragDropListItem } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';
import { logger } from '@/lib/logger';
import { getStatusColor } from '@/lib/theme/colors';

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator', status: 'active' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'pending' },
];

export default function DataContent() {
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'delete' | 'view'>('create');

  const kanbanColumns: KanbanColumn[] = [
    { id: '1', title: 'To Do', status: 'todo', color: getStatusColor('todo') },
    { id: '2', title: 'In Progress', status: 'in-progress', color: getStatusColor('in-progress') },
    { id: '3', title: 'Done', status: 'done', color: getStatusColor('done') },
  ];

  const kanbanCards: KanbanCard[] = [
    { id: '1', title: 'Task 1', description: 'Task 1 description', status: 'todo', priority: 'high', assignee: 'John Doe' },
    { id: '2', title: 'Task 2', description: 'Task 2 description', status: 'todo', priority: 'medium', assignee: 'Jane Smith' },
    { id: '3', title: 'Task 3', description: 'Task 3 description', status: 'in-progress', priority: 'low', assignee: 'Bob Johnson' },
    { id: '4', title: 'Task 4', description: 'Task 4 description', status: 'done', priority: 'high', assignee: 'Alice Brown' },
  ];

  const calendarEvents: CalendarEvent[] = [
    { id: '1', title: 'Réunion équipe', date: new Date(), time: '10:00', color: getStatusColor('todo') },
    { id: '2', title: 'Présentation client', date: new Date(Date.now() + 86400000), time: '14:00', color: getStatusColor('done') },
    { id: '3', title: 'Deadline projet', date: new Date(Date.now() + 172800000), time: '17:00', color: getStatusColor('error') },
  ];

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
          <Table>
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

        <Section title="DataTable">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Tableau de données simple</h4>
              <DataTable
                data={sampleData}
                columns={[
                  { key: 'name', label: 'Nom', sortable: true },
                  { key: 'email', label: 'Email', sortable: true },
                  { key: 'role', label: 'Rôle' },
                  { key: 'status', label: 'Statut' },
                ]}
                pageSize={10}
              />
            </div>
          </div>
        </Section>

        <Section title="DataTableEnhanced">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Tableau de données avancé</h4>
              <DataTableEnhanced
                data={sampleData}
                columns={[
                  { key: 'name', label: 'Nom', sortable: true },
                  { key: 'email', label: 'Email', sortable: true },
                  { key: 'role', label: 'Rôle', filterable: true },
                  { key: 'status', label: 'Statut', filterable: true },
                ]}
                pageSize={10}
                searchable
                selectable
                onSelectionChange={(selected) => {
                  const { logger } = require('@/lib/logger');
                  logger.debug('Table selection changed', { selected });
                }}
              />
            </div>
          </div>
        </Section>

        <Section title="KanbanBoard">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tableau Kanban avec drag & drop pour gérer les tâches par statut.</p>
            <KanbanBoard
              columns={kanbanColumns}
              cards={kanbanCards}
              onCardMove={(cardId, newStatus) => {
                const { logger } = require('@/lib/logger');
                logger.debug('Kanban card moved', { cardId, newStatus });
              }}
              onCardClick={(card) => {
                const { logger } = require('@/lib/logger');
                logger.debug('Kanban card clicked', { card });
              }}
              onCardAdd={(status) => {
                const { logger } = require('@/lib/logger');
                logger.debug('Add card to status', { status });
              }}
            />
          </div>
        </Section>

        <Section title="Calendar">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Calendrier mensuel avec événements.</p>
            <Calendar
              events={calendarEvents}
              onDateClick={(date) => {
                const { logger } = require('@/lib/logger');
                logger.debug('Calendar date clicked', { date });
              }}
              onEventClick={(event) => {
                const { logger } = require('@/lib/logger');
                logger.debug('Calendar event clicked', { event });
              }}
            />
          </div>
        </Section>

        <Section title="CRUDModal">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Modal pour les opérations CRUD (Create, Read, Update, Delete).</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => { setCrudMode('create'); setIsCRUDModalOpen(true); }} variant="primary">Créer</Button>
              <Button onClick={() => { setCrudMode('edit'); setIsCRUDModalOpen(true); }} variant="outline">Modifier</Button>
              <Button onClick={() => { setCrudMode('view'); setIsCRUDModalOpen(true); }} variant="outline">Voir</Button>
              <Button onClick={() => { setCrudMode('delete'); setIsCRUDModalOpen(true); }} variant="danger">Supprimer</Button>
            </div>
            <CRUDModal
              isOpen={isCRUDModalOpen}
              onClose={() => setIsCRUDModalOpen(false)}
              title={crudMode === 'create' ? 'Créer un élément' : crudMode === 'edit' ? 'Modifier un élément' : crudMode === 'delete' ? 'Supprimer un élément' : 'Voir un élément'}
              mode={crudMode}
              onSubmit={() => { alert(`${crudMode === 'create' ? 'Création' : 'Modification'} réussie !`); setIsCRUDModalOpen(false); }}
              onDelete={crudMode === 'delete' ? () => { alert('Suppression réussie !'); setIsCRUDModalOpen(false); } : undefined}
            >
              {crudMode === 'delete' ? (
                <p className="text-gray-700 dark:text-gray-300">Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.</p>
              ) : (
                <div className="space-y-4">
                  <Input label="Nom" placeholder="Entrez le nom" />
                  <Input label="Email" type="email" placeholder="entrez@email.com" />
                </div>
              )}
            </CRUDModal>
          </div>
        </Section>

        <Section title="ExportButton">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bouton pour exporter des données en CSV ou Excel.</p>
            <ExportButton
              data={sampleData}
              filename="utilisateurs"
              onExport={(format, data) => {
                logger.userAction('Data export', { format, recordCount: data.length });
                alert(`Export ${format} déclenché !`);
              }}
            />
          </div>
        </Section>

        <Section title="Timeline">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Timeline verticale</h4>
              <Timeline
                items={[
                  { id: '1', title: 'Commande créée', description: 'La commande #1234 a été créée', timestamp: '2024-12-20 10:00', status: 'completed', color: 'success' },
                  { id: '2', title: 'Paiement reçu', description: 'Paiement de €99.99 confirmé', timestamp: '2024-12-20 10:15', status: 'completed', color: 'success' },
                  { id: '3', title: 'En préparation', description: 'Votre commande est en cours de préparation', timestamp: '2024-12-20 11:00', status: 'current', color: 'primary' },
                  { id: '4', title: 'Expédiée', description: 'En attente d\'expédition', timestamp: '', status: 'pending', color: 'default' },
                ]}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Timeline horizontale</h4>
              <Timeline
                items={[
                  { id: '1', title: 'Étape 1', description: 'Complétée', status: 'completed' },
                  { id: '2', title: 'Étape 2', description: 'En cours', status: 'current' },
                  { id: '3', title: 'Étape 3', description: 'À venir', status: 'pending' },
                ]}
                orientation="horizontal"
              />
            </div>
          </div>
        </Section>

        <Section title="List">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Liste simple</h4>
              <List
                items={[
                  { id: '1', content: 'Premier élément', onClick: () => alert('Cliqué sur élément 1') },
                  { id: '2', content: 'Deuxième élément', onClick: () => alert('Cliqué sur élément 2') },
                  { id: '3', content: 'Troisième élément', onClick: () => alert('Cliqué sur élément 3') },
                ]}
                variant="default"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Liste avec bordures</h4>
              <List
                items={[
                  { id: '1', content: 'Élément avec icône', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
                  { id: '2', content: 'Élément avec action', action: <Button size="sm" variant="ghost">Action</Button> },
                  { id: '3', content: 'Élément désactivé', disabled: true },
                ]}
                variant="bordered"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Liste divisée</h4>
              <List
                items={[
                  { id: '1', content: 'Notification 1', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
                  { id: '2', content: 'Notification 2', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
                  { id: '3', content: 'Notification 3', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
                ]}
                variant="divided"
              />
            </div>
          </div>
        </Section>

        <Section title="Virtual Table - Large Datasets">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Table avec défilement virtuel pour gérer efficacement de grands ensembles de données (10,000+ lignes).
            </p>
            <VirtualTable
              data={Array.from({ length: 10000 }, (_, i) => ({
                id: i + 1,
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                role: ['Admin', 'User', 'Moderator'][i % 3],
                status: ['active', 'inactive', 'pending'][i % 3],
              }))}
              columns={[
                { key: 'id', label: 'ID', sortable: true, width: 80 },
                { key: 'name', label: 'Name', sortable: true },
                { key: 'email', label: 'Email', sortable: true },
                { key: 'role', label: 'Role', sortable: true },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (value) => (
                    <Badge variant={value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error'}>
                      {value}
                    </Badge>
                  ),
                },
              ]}
              height={400}
              rowHeight={50}
              onRowClick={(row) => logger.debug('Row clicked', { row })}
            />
          </div>
        </Section>

        <Section title="Drag & Drop List">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Liste avec fonctionnalité de glisser-déposer pour réorganiser les éléments.
            </p>
            <DragDropList
              items={[
                { id: '1', content: <div className="flex items-center gap-2"><Badge>Task 1</Badge><span>Complete user authentication</span></div> },
                { id: '2', content: <div className="flex items-center gap-2"><Badge>Task 2</Badge><span>Implement dashboard layout</span></div> },
                { id: '3', content: <div className="flex items-center gap-2"><Badge>Task 3</Badge><span>Add data visualization</span></div> },
                { id: '4', content: <div className="flex items-center gap-2"><Badge>Task 4</Badge><span>Write unit tests</span></div> },
                { id: '5', content: <div className="flex items-center gap-2"><Badge>Task 5</Badge><span>Deploy to production</span></div> },
              ]}
              onReorder={(newOrder) => {
                logger.debug('List reordered', { newOrder });
                alert(`List reordered! New order: ${newOrder.map((item) => item.id).join(', ')}`);
              }}
              renderItem={(item, index) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">#{index + 1}</span>
                    {item.content}
                  </div>
                </div>
              )}
            />
          </div>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Feedback', href: '/components/feedback' }} next={{ label: 'Utilitaires', href: '/components/utils' }} />
    </PageContainer>
  );
}

