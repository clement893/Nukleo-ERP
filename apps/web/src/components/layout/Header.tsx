'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import Button from '../ui/Button';
import { ThemeToggleWithIcon } from '../ui/ThemeToggle';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import NotificationBellConnected from '../notifications/NotificationBellConnected';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Focus management when menu opens
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const firstLink = mobileMenuRef.current.querySelector('a') as HTMLElement;
      firstLink?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-foreground">
            MODELE<span className="text-primary">FULLSTACK</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
            <Link href="/" className="text-muted-foreground hover:text-primary transition">
              Accueil
            </Link>
            <Link href="/components" className="text-muted-foreground hover:text-primary transition">
              Composants
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleWithIcon />
            {isAuthenticated() ? (
              <>
                <NotificationBellConnected />
                <span className="text-sm text-muted-foreground hidden lg:block">
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
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-foreground hover:bg-muted focus:ring-primary min-h-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            id="mobile-menu"
            className="md:hidden border-t border-border py-4"
            role="menu"
            aria-label="Menu mobile"
          >
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:text-primary transition px-4 py-3 min-h-[44px] flex items-center"
              >
                Accueil
              </Link>
              <Link
                href="/components"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition px-4 py-3 min-h-[44px] flex items-center"
              >
                Composants
              </Link>
              {isAuthenticated() && (
                <>
                  <div className="px-4 py-3">
                    <NotificationBellConnected />
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition px-4 py-3 min-h-[44px] flex items-center"
                  >
                    Dashboard
                  </Link>
                </>
              )}
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

