'use client';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// If you need to prevent static generation, create a Server Component wrapper.

import { useMemo } from 'react';
import Card from '@/components/ui/Card';

// Move static data outside component to prevent recreation on every render
const UI_COMPONENTS = [
  'Accordion', 'Alert', 'Badge', 'Breadcrumb', 'Button', 'Card', 'Checkbox',
  'DataTable', 'DataTableEnhanced', 'DatePicker', 'Dropdown', 'ExportButton',
  'FileUpload', 'FileUploadWithPreview', 'Form', 'FormBuilder', 'Input',
  'KanbanBoard', 'Modal', 'Pagination', 'Progress', 'Radio', 'Select',
  'Skeleton', 'Spinner', 'Switch', 'Tabs', 'Textarea', 'Toast', 'Tooltip'
] as const;

const HOOKS = [
  'useAuth', 'useForm', 'usePagination', 'useFilters', 'usePermissions',
  'useLogger', 'useDebounce', 'useLocalStorage', 'useMediaQuery'
] as const;

const FEATURES = [
  {
    category: 'Frontend',
    items: [
      'Next.js 16 avec App Router et Turbopack',
      'React 19 avec Server Components',
      'TypeScript 5 avec configuration stricte',
      'Tailwind CSS 3 pour le styling',
      'Bibliotheque UI complete (30+ composants ERP)',
      'Hooks reutilisables personnalises',
      'NextAuth.js v5 avec OAuth Google',
      'Protection des routes avec middleware',
      'Gestion centralisee des erreurs',
      'Logging structure',
      'Support du mode sombre',
      'Responsive design mobile-first'
    ]
  },
  {
    category: 'Backend',
    items: [
      'FastAPI avec documentation OpenAPI/Swagger automatique',
      'Pydantic v2 pour la validation des donnees',
      'SQLAlchemy async ORM',
      'Alembic pour les migrations de base de donnees',
      'PostgreSQL avec support async',
      'Authentification JWT avec refresh tokens',
      'Tests avec pytest',
      'Logging avec loguru',
      'Gestion standardisee des erreurs',
      'API RESTful complete',
      'Support CORS configure',
      'Rate limiting'
    ]
  },
  {
    category: 'Types Partages',
    items: [
      'Package @modele/types pour les types TypeScript partages',
      'Generation automatique depuis les schemas Pydantic',
      'Synchronisation frontend/backend',
      'Types type-safe end-to-end'
    ]
  },
  {
    category: 'DevOps & Outils',
    items: [
      'Turborepo pour monorepo optimise',
      'pnpm workspaces pour la gestion des dependances',
      'GitHub Actions CI/CD',
      'Pre-commit hooks avec Husky',
      'Docker & Docker Compose',
      'Pret pour deploiement Railway',
      'Generateurs de code (composants, pages, routes API)',
      'Scripts de migration de base de donnees',
      'Configuration ESLint et Prettier',
      'Storybook pour la documentation des composants'
    ]
  }
] as const;

const PROJECT_STRUCTURE = 'MODELE-NEXTJS-FULLSTACK/\n+-- apps/\n|   +-- web/\n|   |   +-- src/\n|   |   |   +-- app/\n|   |   |   +-- components/\n|   |   |   |   +-- ui/\n|   |   |   |   +-- providers/\n|   |   |   +-- hooks/\n|   |   |   +-- lib/\n|   |   |   |   +-- api/\n|   |   |   |   +-- auth/\n|   |   |   |   +-- errors/\n|   |   |   |   +-- logger/\n|   |   |   |   +-- store/\n|   |   +-- package.json\n|   +-- api/\n|       +-- app/\n|       |   +-- api/\n|       |   +-- models/\n|       |   +-- schemas/\n|       |   +-- services/\n|       +-- alembic/\n+-- packages/\n    +-- types/';

export default function DocsPage() {
  // Memoize tech stack to prevent recreation
  const techStack = useMemo(() => [
    { name: 'Next.js', version: '16.1.0' },
    { name: 'React', version: '19.0.0' },
    { name: 'TypeScript', version: '5.x' },
    { name: 'Tailwind CSS', version: '3.x' },
    { name: 'FastAPI', version: '0.115+' },
    { name: 'Python', version: '3.11+' },
    { name: 'PostgreSQL', version: '14+' },
    { name: 'Turborepo', version: '2.x' },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Documentation Technique du Template
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Vue d'ensemble complete de tous les elements inclus dans ce template full-stack
          </p>
        </div>

        <Card title="Composants UI (30+)" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {UI_COMPONENTS.map((component) => (
              <div
                key={component}
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono"
              >
                {component}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Tous les composants sont disponibles dans <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@/components/ui</code> et exportes depuis <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@/components/ui/index.ts</code>
          </p>
        </Card>

        <Card title="Hooks Personnalises" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HOOKS.map((hook) => (
              <div
                key={hook}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {hook}
                </code>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Disponible dans <code>@/hooks/{hook.toLowerCase()}</code>
                </p>
              </div>
            ))}
          </div>
        </Card>

        {FEATURES.map((feature) => (
          <Card
            key={feature.category}
            title={feature.category}
            className="mb-6"
          >
            <ul className="space-y-2">
              {feature.items.map((item, index) => (
                <li key={`${feature.category}-${index}`} className="flex items-start">
                  <span className="text-green-500 mr-2">*</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card title="Structure du Projet" className="mb-6">
          <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <pre>{PROJECT_STRUCTURE}</pre>
          </div>
        </Card>

        <Card title="Scripts Disponibles" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Developpement</h4>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm dev</code> - Demarrer le frontend</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm dev:full</code> - Demarrer frontend + backend</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm build</code> - Build de production</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm lint</code> - Linter le code</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">alembic upgrade head</code> - Migrations DB</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pytest</code> - Lancer les tests</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">uvicorn app.main:app --reload</code> - Demarrer le serveur</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Stack Technologique" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"
              >
                <div className="font-semibold text-gray-900 dark:text-white">{tech.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{tech.version}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}