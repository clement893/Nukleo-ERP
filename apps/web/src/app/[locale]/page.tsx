/**
 * Home Page
 * With next-intl, this page is automatically served for the default locale
 */

import Link from 'next/link';
import { Button, Card, Container } from '@/components/ui';

export default function HomePage() {
  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Bienvenue sur MODELE-NEXTJS-FULLSTACK
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Template full-stack avec Next.js 16 et FastAPI
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button variant="primary" size="lg">
              Se connecter
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="lg">
              S'inscrire
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Accédez à votre tableau de bord pour gérer vos projets et données.
          </p>
          <Link href="/dashboard">
            <Button variant="ghost">Accéder au dashboard</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Composants</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Explorez notre bibliothèque de composants réutilisables.
          </p>
          <Link href="/components">
            <Button variant="ghost">Voir les composants</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Documentation</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Consultez la documentation pour apprendre à utiliser l'application.
          </p>
          <Link href="/docs">
            <Button variant="ghost">Lire la documentation</Button>
          </Link>
        </Card>
      </div>
    </Container>
  );
}
