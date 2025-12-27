'use client';

import { useState } from 'react';
import { Chart, AdvancedCharts, Card, Button } from '@/components/ui';
import type { ChartDataPoint } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';

const lineChartData: ChartDataPoint[] = [
  { label: 'Jan', value: 65 },
  { label: 'Fév', value: 59 },
  { label: 'Mar', value: 80 },
  { label: 'Avr', value: 81 },
  { label: 'Mai', value: 56 },
  { label: 'Jun', value: 55 },
];

const barChartData: ChartDataPoint[] = [
  { label: 'Lun', value: 20 },
  { label: 'Mar', value: 35 },
  { label: 'Mer', value: 40 },
  { label: 'Jeu', value: 25 },
  { label: 'Ven', value: 30 },
  { label: 'Sam', value: 15 },
  { label: 'Dim', value: 10 },
];

const areaChartData: ChartDataPoint[] = [
  { label: 'Q1', value: 100 },
  { label: 'Q2', value: 150 },
  { label: 'Q3', value: 120 },
  { label: 'Q4', value: 180 },
];

export default function ChartsContent() {
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar' | 'area'>('line');

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Graphiques"
        description="Composants pour visualiser des données avec des graphiques interactifs"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Graphiques' }]}
      />

      <div className="space-y-8">
        <Section title="Chart - Ligne">
          <Card>
            <Chart
              type="line"
              data={lineChartData}
              title="Évolution des ventes"
              height={300} />
          </Card>
        </Section>

        <Section title="Chart - Barres">
          <Card>
            <Chart
              type="bar"
              data={barChartData}
              title="Ventes hebdomadaires"
              height={300} />
          </Card>
        </Section>

        <Section title="Chart - Aire">
          <Card>
            <Chart
              type="area"
              data={areaChartData}
              title="Revenus trimestriels"
              height={300} />
          </Card>
        </Section>

        <Section title="Chart interactif">
          <Card>
            <div className="mb-4 flex gap-2">
              <Button
                variant={selectedChart === 'line' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart('line')}
              >
                Ligne
              </Button>
              <Button
                variant={selectedChart === 'bar' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart('bar')}
              >
                Barres
              </Button>
              <Button
                variant={selectedChart === 'area' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart('area')}
              >
                Aire
              </Button>
            </div>
            <Chart
              type={selectedChart}
              data={lineChartData}
              title={`Graphique en ${selectedChart === 'line' ? 'ligne' : selectedChart === 'bar' ? 'barres' : 'aire'}`}
              height={300} />
          </Card>
        </Section>

        <Section title="Advanced Charts - Scatter">
          <Card>
            <AdvancedCharts
              type="scatter"
              data={[
                { x: 10, y: 20, label: 'Point 1' },
                { x: 15, y: 30, label: 'Point 2' },
                { x: 20, y: 25, label: 'Point 3' },
                { x: 25, y: 40, label: 'Point 4' },
                { x: 30, y: 35, label: 'Point 5' },
                { x: 35, y: 50, label: 'Point 6' },
              ]}
              title="Scatter Chart - Correlation Analysis"
              height={300}
            />
          </Card>
        </Section>

        <Section title="Advanced Charts - Radar">
          <Card>
            <AdvancedCharts
              type="radar"
              data={[
                { label: 'Speed', value: 80, maxValue: 100 },
                { label: 'Reliability', value: 90, maxValue: 100 },
                { label: 'Comfort', value: 70, maxValue: 100 },
                { label: 'Safety', value: 95, maxValue: 100 },
                { label: 'Efficiency', value: 85, maxValue: 100 },
              ]}
              title="Radar Chart - Performance Metrics"
              height={300}
            />
          </Card>
        </Section>

        <Section title="Advanced Charts - Donut">
          <Card>
            <AdvancedCharts
              type="donut"
              data={[
                { label: 'Desktop', value: 45, color: 'var(--color-primary-500)' },
                { label: 'Mobile', value: 30, color: 'var(--color-secondary-500)' },
                { label: 'Tablet', value: 15, color: 'var(--color-warning-500)' },
                { label: 'Other', value: 10, color: 'var(--color-gray-500)' },
              ]}
              title="Donut Chart - Device Distribution"
              height={300}
              innerRadius={0.6}
            />
          </Card>
        </Section>

        <Section title="Advanced Charts - Gauge">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdvancedCharts
                type="gauge"
                data={[]}
                title="CPU Usage"
                height={200}
                min={0}
                max={100}
                value={65}
              />
              <AdvancedCharts
                type="gauge"
                data={[]}
                title="Memory Usage"
                height={200}
                min={0}
                max={100}
                value={45}
              />
              <AdvancedCharts
                type="gauge"
                data={[]}
                title="Disk Usage"
                height={200}
                min={0}
                max={100}
                value={80}
              />
            </div>
          </Card>
        </Section>

        <Section title="Informations">
          <Card>
            <div className="space-y-4 text-foreground">
              <div>
                <h4 className="font-semibold mb-2">Types de graphiques disponibles:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Line:</strong> Graphique en ligne pour visualiser des tendances</li>
                  <li><strong>Bar:</strong> Graphique en barres pour comparer des valeurs</li>
                  <li><strong>Area:</strong> Graphique en aire pour montrer l'évolution cumulée</li>
                  <li><strong>Scatter:</strong> Graphique de dispersion pour analyser les corrélations</li>
                  <li><strong>Radar:</strong> Graphique radar pour comparer plusieurs métriques</li>
                  <li><strong>Donut:</strong> Graphique en donut pour visualiser des proportions</li>
                  <li><strong>Gauge:</strong> Graphique jauge pour afficher des valeurs dans une plage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Utilisation:</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { Chart, AdvancedCharts } from '@/components/ui';
import type { ChartDataPoint, ScatterDataPoint } from '@/components/ui';

// Basic chart
const data: ChartDataPoint[] = [
  { label: 'Jan', value: 65 },
  { label: 'Fév', value: 59 },
];

<Chart type="line" data={data} title="Mon graphique" height={300} />

// Advanced scatter chart
const scatterData: ScatterDataPoint[] = [
  { x: 10, y: 20, label: 'Point 1' },
  { x: 15, y: 30, label: 'Point 2' },
];

<AdvancedCharts type="scatter" data={scatterData} height={300} />`}
                </pre>
              </div>
            </div>
          </Card>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Utilitaires', href: '/components/utils' }} home={{ label: 'Retour à l\'accueil', href: '/components' }} />
    </PageContainer>
  );
}

