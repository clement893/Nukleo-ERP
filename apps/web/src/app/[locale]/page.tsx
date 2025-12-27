/**
 * Home Page - Enhanced with template presentation
 * Uses reusable section components from @/components/sections
 * With next-intl, this page is automatically served for the default locale
 */

'use client';

import { Card, Container, StatsCard } from '@/components/ui';
import ButtonLink from '@/components/ui/ButtonLink';
import { Hero, TechStack, CTA } from '@/components/sections';
import { 
  CheckCircle, 
  Zap, 
  Shield, 
  Code, 
  Database, 
  Globe, 
  Rocket,
  Layers,
  Users,
  Palette,
  Smartphone
} from 'lucide-react';

export default function HomePage() {
  const customFeatures = [
    {
      icon: <Code className="w-6 h-6" />,
      title: '270+ Composants React',
      description: 'Bibliothèque complète de composants UI et fonctionnels, prêts à l\'emploi',
      color: 'text-primary-600 dark:text-primary-400',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Sécurité Enterprise',
      description: 'Authentification JWT, OAuth, MFA, RBAC et protection XSS intégrées',
      color: 'text-success-600 dark:text-success-400',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance Optimisée',
      description: 'Code splitting automatique, optimisation d\'images, monitoring Web Vitals',
      color: 'text-warning-600 dark:text-warning-400',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Backend FastAPI',
      description: 'API REST moderne avec PostgreSQL, migrations Alembic, et validation Pydantic',
      color: 'text-secondary-600 dark:text-secondary-400',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'i18n Intégré',
      description: 'Support multilingue avec next-intl (FR/EN/AR/HE), routing automatique',
      color: 'text-primary-600 dark:text-primary-400',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Thème Personnalisable',
      description: 'Dark mode, système de thème dynamique, et personnalisation complète',
      color: 'text-secondary-600 dark:text-secondary-400',
    },
  ];

  const useCases = [
    {
      title: 'Applications SaaS',
      description: 'Parfait pour créer des applications SaaS B2B ou B2C avec gestion d\'abonnements',
      icon: <Rocket className="w-5 h-5" />,
    },
    {
      title: 'Dashboards Admin',
      description: 'Tableaux de bord administratifs complets avec gestion des utilisateurs et analytics',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      title: 'E-commerce',
      description: 'Plateformes e-commerce avec gestion de produits, commandes et paiements',
      icon: <Smartphone className="w-5 h-5" />,
    },
    {
      title: 'Applications Multi-tenant',
      description: 'Support natif pour les applications multi-organisations avec isolation des données',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-muted dark:via-muted dark:to-muted">
      {/* Hero Section - Using Hero component */}
      <Hero />

      {/* Stats Section - Custom stats with StatsCard component */}
      <div className="bg-background py-12">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard
              title="Composants"
              value="270+"
              change={{ value: 0, type: 'increase', period: 'production-ready' }}
              icon={<Code className="w-6 h-6" />}
            />
            <StatsCard
              title="Catégories"
              value="32"
              change={{ value: 0, type: 'increase', period: 'organisées' }}
              icon={<Layers className="w-6 h-6" />}
            />
            <StatsCard
              title="Technologies"
              value="15+"
              change={{ value: 0, type: 'increase', period: 'intégrées' }}
              icon={<Zap className="w-6 h-6" />}
            />
            <StatsCard
              title="Sécurité"
              value="100%"
              change={{ value: 0, type: 'increase', period: 'auditée' }}
              icon={<Shield className="w-6 h-6" />}
            />
          </div>
        </Container>
      </div>

      {/* Features Section - Custom features using Card component */}
      <div className="bg-background py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un template complet avec toutes les fonctionnalités essentielles pour démarrer rapidement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {customFeatures.map((feature, index) => (
              <Card key={index} hover className="p-6">
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </div>

      {/* Tech Stack Section - Using TechStack component */}
      <TechStack />

      {/* Use Cases Section - Custom section using Card component */}
      <div className="bg-background py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Cas d'usage
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Parfait pour différents types d'applications web modernes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {useCases.map((useCase, index) => (
              <Card key={index} hover className="p-8">
                <div className="flex items-start gap-4">
                  <div className="text-primary-600 dark:text-primary-400 flex-shrink-0">
                    {useCase.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </div>

      {/* Key Features List - Custom section using Card component */}
      <div className="bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-muted dark:to-muted py-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Fonctionnalités SaaS
              </h2>
              <ul className="space-y-4">
                {[
                  'Gestion d\'abonnements avec Stripe',
                  'Gestion d\'équipes multi-utilisateurs',
                  'Système d\'invitations par email',
                  'RBAC avec permissions granulaires',
                  'Tableau de bord analytics intégré',
                  'Support multi-organisations',
                  'Feature flags pour déploiements progressifs',
                  'Système de préférences utilisateur',
                  'Annonces et bannières système',
                  'Feedback et support intégré',
                  'Onboarding multi-étapes',
                  'Documentation et aide intégrées',
                  'Tâches planifiées et jobs en arrière-plan',
                  'Sauvegardes et restauration',
                  'Gestion de modèles d\'email',
                  'Audit trail de sécurité',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Expérience Développeur
              </h2>
              <ul className="space-y-4">
                {[
                  'Génération de code CLI intégrée',
                  'Types TypeScript auto-générés',
                  'Hot reload frontend & backend',
                  'Tests unitaires et E2E inclus',
                  'CI/CD avec GitHub Actions',
                  'Docker Compose pour le développement',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </div>

      {/* CTA Section - Using CTA component */}
      <CTA />

      {/* Quick Links - Custom section using Card component */}
      <div className="bg-background py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                Dashboard
              </h2>
              <p className="text-muted-foreground mb-4">
                Accédez à votre tableau de bord pour gérer vos projets et données.
              </p>
              <ButtonLink href="/dashboard" variant="ghost" className="w-full">
                Accéder au dashboard
              </ButtonLink>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Code className="w-6 h-6 text-success-600 dark:text-success-400" />
                Composants
              </h2>
              <p className="text-muted-foreground mb-4">
                Explorez notre bibliothèque de 270+ composants réutilisables.
              </p>
              <ButtonLink href="/components" variant="ghost" className="w-full">
                Voir les composants
              </ButtonLink>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                Documentation
              </h2>
              <p className="text-muted-foreground mb-4">
                Consultez la documentation complète pour apprendre à utiliser le template.
              </p>
              <ButtonLink href="/docs" variant="ghost" className="w-full">
                Lire la documentation
              </ButtonLink>
            </Card>
          </div>
        </Container>
      </div>
    </div>
  );
}
