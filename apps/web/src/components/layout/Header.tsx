'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import Button from '../ui/Button';
import { ThemeToggleWithIcon } from '../ui/ThemeToggle';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            MODELE<span className="text-primary-600 dark:text-primary-400">FULLSTACK</span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleWithIcon />
            {isAuthenticated() ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden lg:block">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggleWithIcon />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition px-2 py-2"
              >
                Accueil
              </Link>
              <Link
                href="/components"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition px-2 py-2"
              >
                Composants
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition px-2 py-2"
              >
                Dashboard
              </Link>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <div className="px-2 mb-4">
                  <LanguageSwitcher />
                </div>
                {isAuthenticated() ? (
                  <div className="flex flex-col gap-2 px-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.name || user?.email}
                    </span>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="ghost" className="w-full justify-start">
                        Dashboard
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={logout} className="w-full">
                      Déconnexion
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="ghost" className="w-full">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="primary" className="w-full">
                        Inscription
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

