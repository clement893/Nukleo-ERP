'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { 
  LayoutDashboard,
  TrendingUp,
  Users,
  Briefcase,
  CheckSquare,
  MessageSquare,
  FileText,
  Settings,
  UserCircle,
  Building2,
  Calendar,
  DollarSign,
  BarChart3,
  Zap,
  ChevronRight,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { Badge, Card, Input } from '@/components/ui';

// Mock navigation structure
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    badge: null
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: TrendingUp,
    badge: { count: 12, color: 'bg-blue-500' },
    children: [
      { id: 'opportunites', label: 'Opportunités', icon: Zap, href: '/dashboard/commercial/opportunites', badge: { count: 5, color: 'bg-blue-500' } },
      { id: 'pipelines', label: 'Pipelines', icon: BarChart3, href: '/dashboard/commercial/pipeline-client' },
      { id: 'soumissions', label: 'Soumissions', icon: FileText, href: '/dashboard/commercial/soumissions', badge: { count: 3, color: 'bg-orange-500' } },
      { id: 'temoignages', label: 'Témoignages', icon: MessageSquare, href: '/dashboard/commercial/temoignages', badge: { count: 4, color: 'bg-green-500' } },
    ]
  },
  {
    id: 'reseau',
    label: 'Réseau',
    icon: Users,
    badge: { count: 8, color: 'bg-purple-500' },
    children: [
      { id: 'contacts', label: 'Contacts', icon: UserCircle, href: '/dashboard/reseau/contacts' },
      { id: 'entreprises', label: 'Entreprises', icon: Building2, href: '/dashboard/reseau/entreprises' },
      { id: 'temoignages-reseau', label: 'Témoignages', icon: MessageSquare, href: '/dashboard/reseau/temoignages' },
    ]
  },
  {
    id: 'projets',
    label: 'Projets',
    icon: Briefcase,
    badge: null,
    children: [
      { id: 'projets-list', label: 'Projets', icon: Briefcase, href: '/dashboard/projets/projets' },
      { id: 'taches', label: 'Tâches', icon: CheckSquare, href: '/dashboard/projets/taches', badge: { count: 15, color: 'bg-red-500' } },
      { id: 'equipes', label: 'Équipes', icon: Users, href: '/dashboard/projets/equipes' },
      { id: 'clients', label: 'Clients', icon: Building2, href: '/dashboard/projets/clients' },
    ]
  },
  {
    id: 'management',
    label: 'Management',
    icon: Users,
    badge: { count: 6, color: 'bg-orange-500' },
    children: [
      { id: 'employes', label: 'Employés', icon: UserCircle, href: '/dashboard/management/employes' },
      { id: 'feuilles-temps', label: 'Feuilles de temps', icon: Calendar, href: '/dashboard/management/feuilles-temps', badge: { count: 3, color: 'bg-orange-500' } },
      { id: 'onboarding', label: 'Onboarding', icon: Zap, href: '/dashboard/management/onboarding' },
      { id: 'vacances', label: 'Vacances', icon: Calendar, href: '/dashboard/management/vacances', badge: { count: 2, color: 'bg-blue-500' } },
      { id: 'depenses', label: 'Dépenses', icon: DollarSign, href: '/dashboard/management/compte-depenses', badge: { count: 1, color: 'bg-green-500' } },
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    href: '/dashboard/settings',
    badge: null
  },
];

export default function SidebarDemoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['commercial', 'reseau']));
  const [activeItem, setActiveItem] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Logo & Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Nukleo
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ERP Moderne</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedGroups.has(item.id);
              const isActive = activeItem === item.id;
              const hasChildren = 'children' in item && item.children;

              return (
                <div key={item.id}>
                  {/* Parent Item */}
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleGroup(item.id);
                      } else {
                        setActiveItem(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#523DC9]/10 to-[#6B1817]/10 text-[#523DC9] dark:text-[#A7A2CF] border border-[#523DC9]/20' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#523DC9]' : 'text-gray-500 dark:text-gray-400 group-hover:text-[#523DC9]'} transition-colors`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge className={`${item.badge.color} text-white text-xs px-2 py-0.5`}>
                          {item.badge.count}
                        </Badge>
                      )}
                      {hasChildren && (
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                  </button>

                  {/* Children Items */}
                  {hasChildren && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeItem === child.id;

                        return (
                          <button
                            key={child.id}
                            onClick={() => setActiveItem(child.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                              isChildActive
                                ? 'bg-[#523DC9]/5 text-[#523DC9] dark:text-[#A7A2CF]'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <ChildIcon className={`w-4 h-4 ${isChildActive ? 'text-[#523DC9]' : 'text-gray-400 group-hover:text-[#523DC9]'} transition-colors`} />
                              <span className="text-sm">{child.label}</span>
                            </div>
                            {child.badge && (
                              <Badge className={`${child.badge.color} text-white text-xs px-1.5 py-0.5`}>
                                {child.badge.count}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#523DC9] to-[#6B1817] flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Jean Dupont</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@nukleo.com</p>
              </div>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Menu Latéral Modernisé - Design Nukleo
          </h1>
          <div className="w-10" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Hero Card */}
            <Card className="glass-card p-8 rounded-2xl border border-[#A7A2CF]/20">
              <div className="relative rounded-xl overflow-hidden mb-6 -mx-8 -mt-8 px-8 pt-8 pb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
                  backgroundSize: '200px 200px'
                }} />
                <div className="relative">
                  <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Nouveau Menu Latéral Nukleo
                  </h2>
                  <p className="text-white/80 text-lg">
                    Design moderne et épuré avec navigation intuitive
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Caractéristiques du nouveau design</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-[#523DC9]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Navigation Hiérarchique</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Groupes expandables avec indicateurs visuels clairs</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-[#10B981]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Badges de Notification</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Compteurs colorés pour les éléments nécessitant attention</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center flex-shrink-0">
                      <Search className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Recherche Intégrée</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Trouvez rapidement n'importe quelle page</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Profil Utilisateur</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Accès rapide au profil et notifications</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Design Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">États de Navigation</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#523DC9]/10 to-[#6B1817]/10 border border-[#523DC9]/20">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-[#523DC9]" />
                      <span className="font-medium text-[#523DC9]">État Actif</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">État Normal</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#523DC9]" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">État Hover</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Badges & Compteurs</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Notifications importantes</span>
                    <Badge className="bg-red-500 text-white">15</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">En attente</span>
                    <Badge className="bg-orange-500 text-white">6</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Nouveaux éléments</span>
                    <Badge className="bg-blue-500 text-white">12</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Complétés</span>
                    <Badge className="bg-green-500 text-white">8</Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Instructions */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comment utiliser ce design</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p>✅ <strong>Cliquez sur les groupes</strong> pour les expandre/réduire</p>
                <p>✅ <strong>Utilisez la recherche</strong> en haut du menu pour trouver rapidement une page</p>
                <p>✅ <strong>Les badges colorés</strong> indiquent le nombre d'éléments nécessitant attention</p>
                <p>✅ <strong>L'état actif</strong> est clairement visible avec le gradient Nukleo</p>
                <p>✅ <strong>Le profil utilisateur</strong> en bas permet un accès rapide aux paramètres</p>
                <p>✅ <strong>Responsive</strong> - Le menu se cache automatiquement sur mobile</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
