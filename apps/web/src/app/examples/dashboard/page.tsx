/**
 * Dashboard Example
 * Exemple complet de dashboard SaaS avec tous les composants
 */

'use client';
import { StatsCard, DataTable, Chart, Button, Badge, CommandPalette, useCommandPalette } from '@/components/ui';
import type { Column, Command, ChartDataPoint } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';

const statsData = [
  { title: 'Utilisateurs actifs', value: '12,345', change: { value: 12, type: 'increase' as const }, icon: '👥' },
  { title: 'Revenus mensuels', value: '€45,678', change: { value: 8, type: 'increase' as const }, icon: '💰' },
  { title: 'Commandes', value: '892', change: { value: 5, type: 'decrease' as const }, icon: '📦' },
  { title: 'Taux de conversion', value: '3.2%', change: { value: 0.5, type: 'increase' as const }, icon: '📈' },
];

const chartData: ChartDataPoint[] = [
  { label: 'Jan', value: 120 },
  { label: 'Fév', value: 150 },
  { label: 'Mar', value: 130 },
  { label: 'Avr', value: 180 },
  { label: 'Mai', value: 200 },
  { label: 'Juin', value: 170 },
];

const tableData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', revenue: '€1,234' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', revenue: '€2,345' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', revenue: '€567' },
];

const tableColumns: Column[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { 
    key: 'status', 
    label: 'Statut', 
    render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'error'}>{row.status}</Badge>
  },
  { key: 'revenue', label: 'Revenus', sortable: true },
];

export default function DashboardExample() {
  const commands: Command[] = [
    { id: '1', label: 'Nouveau utilisateur', category: 'Actions', action: () => alert('Créer utilisateur') },
    { id: '2', label: 'Paramètres', category: 'Navigation', action: () => alert('Paramètres') },
  ];
  const { isOpen, close } = useCommandPalette(commands);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Exemple complet de dashboard SaaS"
        breadcrumbs={[{ label: 'Exemples', href: '/examples' }, { label: 'Dashboard' }]}
      />

      <div className="space-y-8">
        {/* Stats Cards */}
        <Section title="Statistiques">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={<span className="text-2xl">{stat.icon}</span>}
              />
            ))}
          </div>
        </Section>

        {/* Chart */}
        <Section title="Évolution des Ventes">
          <Chart data={chartData} type="line" title="Ventes mensuelles" />
        </Section>

        {/* Data Table */}
        <Section title="Utilisateurs Récents">
          <DataTable
            data={tableData}
            columns={tableColumns}
            pageSize={10}
          />
        </Section>
      </div>

      <CommandPalette commands={commands} isOpen={isOpen} onClose={close} />
    </PageContainer>
  );
}

