'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Briefcase, 
  Clock, 
  Bot, 
  AlertCircle, 
  DollarSign, 
  Plane, 
  User 
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/fr/portail-employe-demo', icon: LayoutDashboard },
  { name: 'Mes tâches', href: '/fr/portail-employe-demo/taches', icon: CheckSquare },
  { name: 'Mes projets', href: '/fr/portail-employe-demo/projets', icon: Briefcase },
  { name: 'Mes feuilles de temps', href: '/fr/portail-employe-demo/feuilles-de-temps', icon: Clock },
  { name: 'Mon Leo', href: '/fr/portail-employe-demo/leo', icon: Bot },
  { name: 'Mes deadlines', href: '/fr/portail-employe-demo/deadlines', icon: AlertCircle },
  { name: 'Mes comptes de dépenses', href: '/fr/portail-employe-demo/depenses', icon: DollarSign },
  { name: 'Mes vacances', href: '/fr/portail-employe-demo/vacances', icon: Plane },
  { name: 'Mon profil', href: '/fr/portail-employe-demo/profil', icon: User },
];

export default function PortailEmployeDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mon Portail Employé
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ricardo Wierzynski
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Développeur Senior
          </p>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/fr/portail-employe-demo' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#523DC9] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Stats rapides */}
        <div className="mt-8 p-4 rounded-lg bg-gradient-to-br from-[#523DC9]/10 to-[#5F2B75]/10 border border-[#523DC9]/20">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Activité cette semaine
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Heures</span>
              <span className="font-bold text-[#523DC9]">38.5h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tâches</span>
              <span className="font-bold text-[#523DC9]">12/18</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Projets</span>
              <span className="font-bold text-[#523DC9]">4</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
