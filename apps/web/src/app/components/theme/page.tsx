'use client';

import { Card, Button, Input, Badge, ThemeToggle, ThemeToggleWithIcon, ClientOnly } from '@/components/ui';
import { PageHeader, PageContainer, Section, ExampleCard } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeManager } from '@/components/theme/ThemeManager';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Client Components run on the client side, so they don't need this export.

function ThemePageContent() {
  const { theme, resolvedTheme, setTheme } = useTheme();

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
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle avec icône animée
                </span>
              </div>
            </ExampleCard>

            <ExampleCard title="Toggle avec Icône">
              <div className="flex items-center gap-4">
                <ThemeToggleWithIcon />
                <span className="text-sm text-gray-600 dark:text-gray-400">
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
                <span className="text-gray-700 dark:text-gray-300 font-medium">Thème sélectionné:</span>
                <Badge variant="info">{theme}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Thème actif:</span>
                <Badge variant={resolvedTheme === 'dark' ? 'default' : 'info'}>
                  {resolvedTheme}
                </Badge>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  size="sm" 
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button 
                  size="sm" 
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button 
                  size="sm" 
                  variant={theme === 'system' ? 'primary' : 'outline'}
                  onClick={() => setTheme('system')}
                >
                  System
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Composants Adaptés au Dark Mode">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExampleCard title="Card">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Exemple de Card
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
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
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
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

        {/* Gestionnaire de Couleurs */}
        <Section title="Personnalisation des Couleurs">
          <div className="max-w-2xl">
            <ThemeManager />
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note :</strong> Les modifications de couleurs s'appliquent immédiatement à tous les composants du site et sont sauvegardées automatiquement.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

export default function ThemePage() {
  return (
    <ClientOnly>
      <ThemePageContent />
    </ClientOnly>
  );
}
