'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import Button from '../ui/Button';
import { ThemeToggleWithIcon } from '../ui/ThemeToggle';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            MODELE<span className="text-primary-600 dark:text-primary-400">FULLSTACK</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
              Accueil
            </Link>
            <Link href="/components" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
              Composants
            </Link>
            <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleWithIcon />
            {isAuthenticated() ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {user?.name || user?.email}
                </span>
                <Link href="/dashboard">
                  <Button size="sm" variant="ghost">
                    Dashboard
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={logout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button size="sm" variant="ghost">
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" variant="primary">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

