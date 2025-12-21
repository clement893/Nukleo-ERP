'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import Button from '../ui/Button';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            MODELE<span className="text-blue-600">FULLSTACK</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              Accueil
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated() ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
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

