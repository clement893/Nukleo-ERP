/**
 * Configuration du Sitemap
 * Centralise toutes les pages du site pour le sitemap HTML et XML
 */

export interface SitemapPage {
  path: string;
  title: string;
  description: string;
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  requiresAuth?: boolean; // Indique si la page nécessite une authentification
  requiresAdmin?: boolean; // Indique si la page nécessite des droits administrateur
}

export interface SitemapCategory {
  name: string;
  pages: SitemapPage[];
}

// Configuration de l'URL de base du site
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Structure des pages du site organisées par catégories
export const sitePages: Record<string, SitemapPage[]> = {
  'Accueil': [
    { 
      path: '/', 
      title: 'Accueil', 
      description: 'Page d\'accueil du site',
      priority: 1.0,
      changefreq: 'daily',
    },
  ],
  'Authentification': [
    { 
      path: '/auth/login', 
      title: 'Connexion', 
      description: 'Page de connexion',
      priority: 0.8,
      changefreq: 'monthly',
    },
    { 
      path: '/auth/register', 
      title: 'Inscription', 
      description: 'Page d\'inscription',
      priority: 0.8,
      changefreq: 'monthly',
    },
    { 
      path: '/auth/signin', 
      title: 'Sign In', 
      description: 'Page de connexion alternative',
      priority: 0.7,
      changefreq: 'monthly',
    },
    { 
      path: '/auth/callback', 
      title: 'Callback', 
      description: 'Callback OAuth',
      priority: 0.5,
      changefreq: 'monthly',
    },
  ],
  'Dashboard': [
    { 
      path: '/dashboard', 
      title: 'Dashboard', 
      description: 'Tableau de bord principal',
      priority: 0.9,
      changefreq: 'daily',
      requiresAuth: true,
    },
  ],
  'Abonnements': [
    { 
      path: '/pricing', 
      title: 'Tarifs', 
      description: 'Page des plans et tarifs',
      priority: 0.9,
      changefreq: 'weekly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/subscriptions', 
      title: 'Mes Abonnements', 
      description: 'Gestion des abonnements',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    { 
      path: '/subscriptions/success', 
      title: 'Succès Abonnement', 
      description: 'Confirmation d\'abonnement',
      priority: 0.6,
      changefreq: 'monthly',
      requiresAuth: true,
    },
  ],
  'Administration': [
    { 
      path: '/admin', 
      title: 'Admin', 
      description: 'Panneau d\'administration',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
    { 
      path: '/admin/teams', 
      title: 'Gestion des Équipes', 
      description: 'Administration des équipes',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
    { 
      path: '/admin/invitations', 
      title: 'Invitations', 
      description: 'Gestion des invitations',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
    { 
      path: '/admin/rbac', 
      title: 'RBAC', 
      description: 'Gestion des rôles et permissions',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
  ],
  'Exemples': [
    { 
      path: '/examples', 
      title: 'Exemples', 
      description: 'Page d\'exemples',
      priority: 0.6,
      changefreq: 'monthly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/examples/dashboard', 
      title: 'Exemple Dashboard', 
      description: 'Exemple de tableau de bord',
      priority: 0.6,
      changefreq: 'monthly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/examples/onboarding', 
      title: 'Exemple Onboarding', 
      description: 'Exemple d\'onboarding',
      priority: 0.6,
      changefreq: 'monthly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/examples/settings', 
      title: 'Exemple Paramètres', 
      description: 'Exemple de paramètres',
      priority: 0.6,
      changefreq: 'monthly',
      requiresAuth: false, // Page publique
    },
  ],
  'Outils': [
    { 
      path: '/ai/test', 
      title: 'Test IA', 
      description: 'Page de test pour l\'IA',
      priority: 0.5,
      changefreq: 'monthly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/email/test', 
      title: 'Test Email', 
      description: 'Page de test pour les emails',
      priority: 0.5,
      changefreq: 'monthly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/db/test', 
      title: 'Database Health Check', 
      description: 'Page de vérification de la santé de la base de données',
      priority: 0.5,
      changefreq: 'monthly',
      requiresAuth: true, // Protected page
    },
    { 
      path: '/monitoring', 
      title: 'Monitoring', 
      description: 'Page de monitoring',
      priority: 0.6,
      changefreq: 'weekly',
      requiresAuth: false, // Page publique
    },
    { 
      path: '/docs', 
      title: 'Documentation', 
      description: 'Documentation du projet',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: false, // Page publique
    },
  ],
};

// Fonction utilitaire pour obtenir toutes les pages en liste plate
export function getAllPages(): SitemapPage[] {
  return Object.values(sitePages).flat();
}

// Fonction utilitaire pour obtenir les pages pour le sitemap XML
export function getPagesForXML(): Array<{ path: string; priority: number; changefreq: string }> {
  return getAllPages().map(page => ({
    path: page.path,
    priority: page.priority || 0.5,
    changefreq: page.changefreq || 'monthly',
  }));
}

