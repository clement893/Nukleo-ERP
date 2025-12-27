'use client';

import { Card, Input, Badge, Button, ThemeToggle, ThemeToggleWithIcon, ClientOnly } from '@/components/ui';
import { PageHeader, PageContainer, Section, ExampleCard } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Client Components run on the client side, so they don't need this export.

function ThemePageContent() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <PageContainer>
      <PageHeader 
        title="Mode Sombre / Mode Clair" 
        description="Découvrez le système de thème avec support du dark mode"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Thème' }
        ]} 
      />

      <div className="space-y-8">
        <Section title="Switcher de Thème">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExampleCard title="Toggle Simple">
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">
                  Toggle avec icône animée
                </span>
              </div>
            </ExampleCard>

            <ExampleCard title="Toggle avec Icône">
              <div className="flex items-center gap-4">
                <ThemeToggleWithIcon />
                <span className="text-sm text-muted-foreground">
                  Toggle avec icône soleil/lune
                </span>
              </div>
            </ExampleCard>
          </div>
        </Section>

        <Section title="État du Thème">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Thème sélectionné:</span>
                <Badge variant="info">{theme}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Thème actif:</span>
                <Badge variant={resolvedTheme === 'dark' ? 'default' : 'info'}>
                  {resolvedTheme}
                </Badge>
              </div>
              <div className="pt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note :</strong> Pour modifier votre thème, veuillez utiliser la page{' '}
                  <a href="/dashboard/theme" className="underline font-semibold">
                    Paramètres de Thème
                  </a>{' '}
                  dans le dashboard.
                </p>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Composants Adaptés au Dark Mode">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExampleCard title="Card">
              <Card>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Exemple de Card
                </h3>
                <p className="text-muted-foreground">
                  Cette card s'adapte automatiquement au thème actif.
                </p>
              </Card>
            </ExampleCard>

            <ExampleCard title="Input">
              <Input
                label="Email"
                placeholder="exemple@email.com"
                type="email"
              />
            </ExampleCard>

            <ExampleCard title="Badges">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </ExampleCard>

            <ExampleCard title="Boutons">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </ExampleCard>
          </div>
        </Section>

        <Section title="Informations">
          <Card>
            <div className="space-y-4 text-foreground">
              <div>
                <h4 className="font-semibold mb-2">Fonctionnalités:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Support de trois modes : Light, Dark, et System (suit les préférences système)</li>
                  <li>Persistance du choix dans localStorage</li>
                  <li>Transition fluide entre les thèmes</li>
                  <li>Tous les composants UI adaptés automatiquement</li>
                  <li>Respect des préférences système par défaut</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Utilisation:</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui';

function MyComponent() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  
  return <ThemeToggle />;
}`}
                </pre>
              </div>
            </div>
          </Card>
        </Section>

        {/* Information about Theme Management */}
        <Section title="Gestion du Thème">
          <Card>
            <div className="space-y-4 text-foreground">
              <div>
                <h4 className="font-semibold mb-2">Gestion du Thème:</h4>
                <p className="text-sm mb-4">
                  Pour personnaliser votre thème (mode clair/sombre) et vos préférences, veuillez vous rendre sur la page{' '}
                  <a href="/dashboard/theme" className="text-primary-600 dark:text-primary-400 underline font-semibold">
                    Paramètres de Thème
                  </a>{' '}
                  dans le dashboard.
                </p>
                <p className="text-sm">
                  Les administrateurs peuvent gérer les thèmes de la plateforme via le dashboard d'administration.
                </p>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}

export default function ThemeContent() {
  return (
    <ClientOnly>
      <ThemePageContent />
    </ClientOnly>
  );
}

