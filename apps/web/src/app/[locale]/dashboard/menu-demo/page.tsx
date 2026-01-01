'use client';

import { useState } from 'react';
import { NukleoSidebar } from '@/components/nukleo';
import { Card } from '@/components/ui';
import { Menu } from 'lucide-react';

export default function MenuDemoPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nouveau menu Nukleo */}
      <NukleoSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}>
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 glass-navbar">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Demo Menu Nukleo</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 mt-14 md:mt-0">
          {/* Header */}
          <div className="relative bg-nukleo-gradient overflow-hidden rounded-2xl p-8 mb-8">
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-nukleo font-bold text-white mb-2">
                Demo Menu Latéral Nukleo
              </h1>
              <p className="text-white/80 text-lg">
                Découvrez le nouveau design du menu avec le brand Nukleo
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fonctionnalités */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-nukleo font-bold mb-4 text-[#523DC9]">
                ✨ Fonctionnalités
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Gradient Aurora Borealis</strong> en header avec texture grain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Icônes colorées</strong> avec background par catégorie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Indicateur actif</strong> avec gradient violet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Groupes collapsibles</strong> avec badges compteurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Recherche stylisée</strong> avec glassmorphism</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Footer profil utilisateur</strong> avec avatar gradient</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Mode collapsed</strong> avec bouton toggle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#523DC9]">•</span>
                  <span><strong>Animations fluides</strong> partout</span>
                </li>
              </ul>
            </Card>

            {/* Instructions */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-nukleo font-bold mb-4 text-[#523DC9]">
                🎯 Instructions
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Desktop:</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Cliquez sur le bouton avec flèches pour toggle collapsed/expanded</li>
                    <li>• Testez la recherche pour filtrer les items</li>
                    <li>• Cliquez sur les groupes pour les ouvrir/fermer</li>
                    <li>• Hover sur les items pour voir les effets</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Mobile:</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Cliquez sur le bouton menu en haut à gauche</li>
                    <li>• Le menu s'ouvre en overlay</li>
                    <li>• Cliquez en dehors pour fermer</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Palette de couleurs */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-nukleo font-bold mb-4 text-[#523DC9]">
                🎨 Palette Nukleo
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#523DC9]" />
                  <div>
                    <p className="font-semibold text-sm">Nukleo Purple</p>
                    <p className="text-xs text-gray-500">#523DC9</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#5F2B75]" />
                  <div>
                    <p className="font-semibold text-sm">Nukleo Violet</p>
                    <p className="text-xs text-gray-500">#5F2B75</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#6B1817]" />
                  <div>
                    <p className="font-semibold text-sm">Nukleo Crimson</p>
                    <p className="text-xs text-gray-500">#6B1817</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#A7A2CF]" />
                  <div>
                    <p className="font-semibold text-sm">Nukleo Lavender</p>
                    <p className="text-xs text-gray-500">#A7A2CF</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comparaison */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-nukleo font-bold mb-4 text-[#523DC9]">
                📊 Avant / Après
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Avant:</h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Header simple blanc</li>
                    <li>• Icônes monochromes</li>
                    <li>• Barre active bleue</li>
                    <li>• Groupes basiques</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Après:</h3>
                  <ul className="space-y-1 text-[#523DC9]">
                    <li>• Gradient Aurora Borealis</li>
                    <li>• Icônes colorées avec background</li>
                    <li>• Gradient violet + glassmorphism</li>
                    <li>• Badges compteurs + animations</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Ce menu est une <strong>démonstration</strong> du nouveau design Nukleo.
            </p>
            <p className="mt-1">
              Il peut être appliqué sur toutes les pages de l'ERP pour une cohérence parfaite ! 🚀
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
