'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Card, Button, Badge, Input } from '@/components/ui';
import Link from 'next/link';
import { 
  Search, 
  ExternalLink, 
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Target,
  FolderKanban,
  Sparkles,
  Settings,
  Eye,
  TestTube
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';

interface DemoPage {
  name: string;
  href: string;
  description?: string;
  category: string;
  icon?: React.ReactNode;
}

const demoPages: DemoPage[] = [
  // Page Publique
  {
    name: 'Demo Publique',
    href: '/demo',
    description: 'Page de démonstration publique accessible sans authentification',
    category: 'Pages Publiques',
    icon: <Eye className="w-4 h-4" />,
  },
  
  // Administration
  {
    name: 'Admin Media',
    href: '/dashboard/admin-media-demo',
    description: 'Démo de gestion des médias',
    category: 'Administration',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Admin Teams',
    href: '/dashboard/admin-teams-demo',
    description: 'Démo de gestion des équipes',
    category: 'Administration',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Admin Users',
    href: '/dashboard/admin-users-demo',
    description: 'Démo de gestion des utilisateurs',
    category: 'Administration',
    icon: <Users className="w-4 h-4" />,
  },
  
  // Portail Employé
  {
    name: 'Portail Employé',
    href: '/portail-employe-demo',
    description: 'Page principale du portail employé',
    category: 'Portail Employé',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    name: 'Mes Tâches',
    href: '/portail-employe-demo/taches',
    description: 'Mes tâches (démo)',
    category: 'Portail Employé',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Mes Projets',
    href: '/portail-employe-demo/projets',
    description: 'Mes projets (démo)',
    category: 'Portail Employé',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    name: 'Feuilles de Temps',
    href: '/portail-employe-demo/feuilles-de-temps',
    description: 'Mes feuilles de temps (démo)',
    category: 'Portail Employé',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    name: 'Comptes de Dépenses',
    href: '/portail-employe-demo/depenses',
    description: 'Mes comptes de dépenses (démo)',
    category: 'Portail Employé',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    name: 'Vacances',
    href: '/portail-employe-demo/vacances',
    description: 'Mes vacances (démo)',
    category: 'Portail Employé',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    name: 'Mon Leo',
    href: '/portail-employe-demo/leo',
    description: 'Mon Leo (démo)',
    category: 'Portail Employé',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    name: 'Deadlines',
    href: '/portail-employe-demo/deadlines',
    description: 'Mes deadlines (démo)',
    category: 'Portail Employé',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    name: 'Mon Profil',
    href: '/portail-employe-demo/profil',
    description: 'Mon profil (démo)',
    category: 'Portail Employé',
    icon: <Users className="w-4 h-4" />,
  },
  
  // Projets & Tâches
  {
    name: 'Projets',
    href: '/dashboard/projets-demo',
    description: 'Démo de gestion des projets',
    category: 'Projets & Tâches',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    name: 'Tâches',
    href: '/dashboard/taches-demo',
    description: 'Démo de gestion des tâches',
    category: 'Projets & Tâches',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Demo Projet',
    href: '/dashboard/demo',
    description: 'Page démo de projet avec onglets',
    category: 'Projets & Tâches',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  
  // Clients & Contacts
  {
    name: 'Clients',
    href: '/dashboard/clients-demo',
    description: 'Démo de gestion des clients',
    category: 'Clients & Contacts',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Détail Client',
    href: '/dashboard/client-detail-demo',
    description: 'Démo de détail client',
    category: 'Clients & Contacts',
    icon: <Eye className="w-4 h-4" />,
  },
  {
    name: 'Contacts',
    href: '/dashboard/contacts-demo',
    description: 'Démo de gestion des contacts',
    category: 'Clients & Contacts',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Détail Contact',
    href: '/dashboard/contact-detail-demo',
    description: 'Démo de détail contact',
    category: 'Clients & Contacts',
    icon: <Eye className="w-4 h-4" />,
  },
  
  // Entreprises & Réseau
  {
    name: 'Entreprises',
    href: '/dashboard/entreprises-demo',
    description: 'Démo de gestion des entreprises',
    category: 'Entreprises & Réseau',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    name: 'Détail Entreprise',
    href: '/dashboard/entreprise-detail-demo',
    description: 'Démo de détail entreprise',
    category: 'Entreprises & Réseau',
    icon: <Eye className="w-4 h-4" />,
  },
  {
    name: 'Réseau',
    href: '/dashboard/reseau-demo',
    description: 'Démo du module réseau',
    category: 'Entreprises & Réseau',
    icon: <Users className="w-4 h-4" />,
  },
  
  // Commercial
  {
    name: 'Commercial',
    href: '/dashboard/commercial-demo',
    description: 'Démo du module commercial',
    category: 'Commercial',
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    name: 'Opportunités',
    href: '/dashboard/opportunites-demo',
    description: 'Démo de gestion des opportunités',
    category: 'Commercial',
    icon: <Target className="w-4 h-4" />,
  },
  {
    name: 'Soumissions',
    href: '/dashboard/soumissions-demo',
    description: 'Démo de gestion des soumissions',
    category: 'Commercial',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Pipeline',
    href: '/dashboard/pipeline-demo',
    description: 'Démo de pipeline',
    category: 'Commercial',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    name: 'Pipelines',
    href: '/dashboard/pipelines-demo',
    description: 'Démo de pipelines (liste)',
    category: 'Commercial',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    name: 'Pipeline Client',
    href: '/dashboard/pipeline-client-demo',
    description: 'Démo de pipeline client',
    category: 'Commercial',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  
  // Finances
  {
    name: 'Finances',
    href: '/dashboard/finances-demo',
    description: 'Démo du module finances',
    category: 'Finances',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    name: 'Facturations',
    href: '/dashboard/facturations-demo',
    description: 'Démo de gestion des facturations',
    category: 'Finances',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Compte de Dépenses',
    href: '/dashboard/compte-depenses-demo',
    description: 'Démo de gestion des comptes de dépenses',
    category: 'Finances',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    name: 'Cashflow',
    href: '/dashboard/cashflow-management-demo',
    description: 'Démo de gestion du cashflow',
    category: 'Finances',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    name: 'Prévision Financière',
    href: '/dashboard/prevision-financiere-demo',
    description: 'Démo de prévision financière',
    category: 'Finances',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    name: 'Rapport',
    href: '/dashboard/rapport-demo',
    description: 'Démo de rapport',
    category: 'Finances',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Rapport Revenus',
    href: '/dashboard/rapport-revenus-demo',
    description: 'Démo de rapport de revenus',
    category: 'Finances',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    name: 'Rapport Dépenses',
    href: '/dashboard/rapport-depenses-demo',
    description: 'Démo de rapport de dépenses',
    category: 'Finances',
    icon: <FileText className="w-4 h-4" />,
  },
  
  // Ressources Humaines
  {
    name: 'Employés',
    href: '/dashboard/employes-demo',
    description: 'Démo de gestion des employés',
    category: 'Ressources Humaines',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Feuilles de Temps',
    href: '/dashboard/feuilles-temps-demo',
    description: 'Démo de gestion des feuilles de temps',
    category: 'Ressources Humaines',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    name: 'Vacances',
    href: '/dashboard/vacances-demo',
    description: 'Démo de gestion des vacances',
    category: 'Ressources Humaines',
    icon: <Calendar className="w-4 h-4" />,
  },
  
  // Agenda
  {
    name: 'Calendrier',
    href: '/dashboard/calendrier-demo',
    description: 'Démo de calendrier',
    category: 'Agenda',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    name: 'Événements',
    href: '/dashboard/evenements-demo',
    description: 'Démo de gestion des événements',
    category: 'Agenda',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    name: 'Deadlines',
    href: '/dashboard/deadlines-demo',
    description: 'Démo de gestion des deadlines',
    category: 'Agenda',
    icon: <Calendar className="w-4 h-4" />,
  },
  
  // Management
  {
    name: 'Management',
    href: '/dashboard/management-demo',
    description: 'Démo du module management',
    category: 'Management',
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    name: 'Onboarding',
    href: '/dashboard/onboarding-demo',
    description: 'Démo d\'onboarding',
    category: 'Management',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Projects',
    href: '/dashboard/projects-demo',
    description: 'Démo de projets (liste)',
    category: 'Management',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  
  // Interface
  {
    name: 'Sidebar',
    href: '/dashboard/sidebar-demo',
    description: 'Démo de sidebar',
    category: 'Interface',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    name: 'Menu',
    href: '/dashboard/menu-demo',
    description: 'Démo de menu',
    category: 'Interface',
    icon: <Settings className="w-4 h-4" />,
  },
  
  // IA
  {
    name: 'Leo',
    href: '/dashboard/leo-demo',
    description: 'Démo de Leo (assistant IA)',
    category: 'IA',
    icon: <Sparkles className="w-4 h-4" />,
  },
  
  // Tests
  {
    name: 'Card Demo',
    href: '/dashboard/test/card-demo',
    description: 'Démo de composant Card',
    category: 'Tests',
    icon: <TestTube className="w-4 h-4" />,
  },
];

const categoryColors: Record<string, string> = {
  'Pages Publiques': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'Administration': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  'Portail Employé': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'Projets & Tâches': 'bg-green-500/10 text-green-600 border-green-500/30',
  'Clients & Contacts': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'Entreprises & Réseau': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  'Commercial': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  'Finances': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  'Ressources Humaines': 'bg-pink-500/10 text-pink-600 border-pink-500/30',
  'Agenda': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  'Management': 'bg-teal-500/10 text-teal-600 border-teal-500/30',
  'Interface': 'bg-gray-500/10 text-gray-600 border-gray-500/30',
  'IA': 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  'Tests': 'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function AdminDemosContent() {
  const params = useParams();
  const locale = params.locale as string || 'fr';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(demoPages.map(page => page.category));
    return Array.from(cats).sort();
  }, []);

  // Filter pages
  const filteredPages = useMemo(() => {
    return demoPages.filter(page => {
      const matchesSearch = !searchQuery || 
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Group by category
  const groupedPages = useMemo(() => {
    const groups: Record<string, DemoPage[]> = {};
    filteredPages.forEach(page => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });
    return groups;
  }, [filteredPages]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: demoPages.length,
      filtered: filteredPages.length,
      categories: categories.length,
    };
  }, [demoPages.length, filteredPages.length, categories.length]);

  return (
    <PageContainer>
      <PageHeader 
        title="Pages Démos" 
        description="Liste complète de toutes les pages de démonstration disponibles dans l'application"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Pages Démos' }
        ]} 
      />

      {/* Stats */}
      <MotionDiv variant="slideUp" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <TestTube className="w-5 h-5 text-[#523DC9]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total pages démos</div>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.filtered}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pages filtrées</div>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <FolderKanban className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.categories}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Catégories</div>
              </div>
            </div>
          </Card>
        </div>
      </MotionDiv>

      {/* Filters */}
      <MotionDiv variant="slideUp" delay={100} className="mb-6">
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une page démo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[200px]"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </Card>
      </MotionDiv>

      {/* Pages List */}
      <MotionDiv variant="slideUp" delay={200}>
        {Object.keys(groupedPages).length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune page démo trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Essayez de modifier vos critères de recherche
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPages).map(([category, pages]) => (
              <Section key={category} title={category}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page) => (
                    <Card
                      key={page.href}
                      className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {page.icon && (
                            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
                              {page.icon}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {page.name}
                            </h3>
                            {page.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {page.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Badge className={categoryColors[category] || 'bg-gray-500/10 text-gray-600 border-gray-500/30'}>
                          {category}
                        </Badge>
                        <Link 
                          href={`/${locale}${page.href}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ouvrir
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </Section>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
