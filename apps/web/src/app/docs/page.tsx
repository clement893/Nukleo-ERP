'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const uiComponents = [
    'Accordion', 'Alert', 'Badge', 'Breadcrumb', 'Button', 'Card', 'Checkbox',
    'DataTable', 'DataTableEnhanced', 'DatePicker', 'Dropdown', 'ExportButton',
    'FileUpload', 'FileUploadWithPreview', 'Form', 'FormBuilder', 'Input',
    'KanbanBoard', 'Modal', 'Pagination', 'Progress', 'Radio', 'Select',
    'Skeleton', 'Spinner', 'Switch', 'Tabs', 'Textarea', 'Toast', 'Tooltip'
  ];

  const hooks = [
    'useAuth', 'useForm', 'usePagination', 'useFilters', 'usePermissions',
    'useLogger', 'useDebounce', 'useLocalStorage', 'useMediaQuery'
  ];

  const features = [
    {
      category: 'Frontend',
      items: [
        'Next.js 16 avec App Router et Turbopack',
        'React 19 avec Server Components',
        'TypeScript 5 avec configuration stricte',
        'Tailwind CSS 3 pour le styling',
        'BibliothÃ¨que UI complÃ¨te (30+ composants ERP)',
        'Hooks rÃ©utilisables personnalisÃ©s',
        'NextAuth.js v5 avec OAuth Google',
        'Protection des routes avec middleware',
        'Gestion centralisÃ©e des erreurs',
        'Logging structurÃ©',
        'Support du mode sombre',
        'Responsive design mobile-first'
      ]
    },
    {
      category: 'Backend',
      items: [
        'FastAPI avec documentation OpenAPI/Swagger automatique',
        'Pydantic v2 pour la validation des donnÃ©es',
        'SQLAlchemy async ORM',
        'Alembic pour les migrations de base de donnÃ©es',
        'PostgreSQL avec support async',
        'Authentification JWT avec refresh tokens',
        'Tests avec pytest',
        'Logging avec loguru',
        'Gestion standardisÃ©e des erreurs',
        'API RESTful complÃ¨te',
        'Support CORS configurÃ©',
        'Rate limiting'
      ]
    },
    {
      category: 'Types PartagÃ©s',
      items: [
        'Package @modele/types pour les types TypeScript partagÃ©s',
        'GÃ©nÃ©ration automatique depuis les schÃ©mas Pydantic',
        'Synchronisation frontend/backend',
        'Types type-safe end-to-end'
      ]
    },
    {
      category: 'DevOps & Outils',
      items: [
        'Turborepo pour monorepo optimisÃ©',
        'pnpm workspaces pour la gestion des dÃ©pendances',
        'GitHub Actions CI/CD',
        'Pre-commit hooks avec Husky',
        'Docker & Docker Compose',
        'PrÃªt pour dÃ©ploiement Railway',
        'GÃ©nÃ©rateurs de code (composants, pages, routes API)',
        'Scripts de migration de base de donnÃ©es',
        'Configuration ESLint et Prettier',
        'Storybook pour la documentation des composants'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Documentation Technique du Template
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Vue d'ensemble complÃ¨te de tous les Ã©lÃ©ments inclus dans ce template full-stack
          </p>
        </div>

        {/* Composants UI */}
        <Card title="Composants UI (30+)" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uiComponents.map((component) => (
              <div
                key={component}
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono"
              >
                {component}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Tous les composants sont disponibles dans <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@/components/ui</code> et exportÃ©s depuis <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@/components/ui/index.ts</code>
          </p>
        </Card>

        {/* Hooks */}
        <Card title="Hooks PersonnalisÃ©s" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hooks.map((hook) => (
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

        {/* FonctionnalitÃ©s par catÃ©gorie */}
        {features.map((feature) => (
          <Card
            key={feature.category}
            title={feature.category}
            className="mb-6"
          >
            <ul className="space-y-2">
              {feature.items.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">âœ“</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}

        {/* Structure du projet */}
        <Card title="Structure du Projet" className="mb-6">
          <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <pre>{MODELE-NEXTJS-FULLSTACK/
â”œâ”€â”€ apps/
â”‚   â””â”€â”€ web/                    # Next.js 16 frontend
â”‚       â”œâ”€â”€ src/
â”‚       â”‚   â”œâ”€â”€ app/           # Pages et layouts
â”‚       â”‚   â”œâ”€â”€ components/    # Composants React
â”‚       â”‚   â”‚   â”œâ”€â”€ ui/        # Composants UI rÃ©utilisables
â”‚       â”‚   â”‚   â””â”€â”€ providers/ # Providers React
â”‚       â”‚   â”œâ”€â”€ hooks/         # Hooks personnalisÃ©s
â”‚       â”‚   â”œâ”€â”€ lib/           # Utilitaires
â”‚       â”‚   â”‚   â”œâ”€â”€ api/       # Client API
â”‚       â”‚   â”‚   â”œâ”€â”€ auth/      # Authentification
â”‚       â”‚   â”‚   â”œâ”€â”€ errors/    # Gestion d'erreurs
â”‚       â”‚   â”‚   â””â”€â”€ logger/    # Logging
â”‚       â”‚   â””â”€â”€ store/         # State management
â”‚       â””â”€â”€ package.json
â”œâ”€â”€ backend/                    # FastAPI backend
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ api/               # Endpoints API
â”‚   â”‚   â”œâ”€â”€ models/            # ModÃ¨les SQLAlchemy
â”‚   â”‚   â”œâ”€â”€ schemas/           # SchÃ©mas Pydantic
â”‚   â”‚   â””â”€â”€ services/          # Logique mÃ©tier
â”‚   â””â”€â”€ alembic/               # Migrations DB
â””â”€â”€ packages/
    â””â”€â”€ types/                  # Types TypeScript partagÃ©s}</pre>
          </div>
        </Card>

        {/* Scripts disponibles */}
        <Card title="Scripts Disponibles" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">DÃ©veloppement</h4>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm dev</code> - DÃ©marrer le frontend</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm dev:full</code> - DÃ©marrer frontend + backend</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm build</code> - Build de production</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm lint</code> - Linter le code</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">alembic upgrade head</code> - Migrations DB</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pytest</code> - Lancer les tests</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">uvicorn app.main:app --reload</code> - DÃ©marrer le serveur</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Technologies utilisÃ©es */}
        <Card title="Stack Technologique" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Next.js', version: '16.1.0' },
              { name: 'React', version: '19.0.0' },
              { name: 'TypeScript', version: '5.x' },
              { name: 'Tailwind CSS', version: '3.x' },
              { name: 'FastAPI', version: '0.115+' },
              { name: 'Python', version: '3.11+' },
              { name: 'PostgreSQL', version: '14+' },
              { name: 'Turborepo', version: '2.x' },
            ].map((tech) => (
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