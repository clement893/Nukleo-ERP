'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { 
  Plus, 
  X, 
  FolderPlus, 
  UserPlus, 
  FileText, 
  Search,
  Bell,
  Calendar
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export default function QuickActions() {
  const router = useRouter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to build locale-aware paths
  const buildPath = (path: string): string => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // If locale is 'en' (default), no prefix needed
    if (locale === 'en') {
      return `/${cleanPath}`;
    }
    // Otherwise, add locale prefix
    return `/${locale}/${cleanPath}`;
  };

  const actions: QuickAction[] = [
    {
      id: 'new-project',
      label: 'Nouveau projet',
      icon: <FolderPlus className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      onClick: () => {
        // Navigate to projects page - creation is done via modal on that page
        router.push(buildPath('dashboard/projets/projets'));
        setIsOpen(false);
      },
    },
    {
      id: 'new-client',
      label: 'Nouveau client',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      onClick: () => {
        // Navigate to clients page - creation is done via modal on that page
        router.push(buildPath('dashboard/projets/clients'));
        setIsOpen(false);
      },
    },
    {
      id: 'new-task',
      label: 'Nouvelle tâche',
      icon: <FileText className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      onClick: () => {
        router.push(buildPath('dashboard/projets/taches'));
        setIsOpen(false);
      },
    },
    {
      id: 'search',
      label: 'Recherche globale',
      icon: <Search className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      onClick: () => {
        // Command palette functionality can be implemented with a dedicated component
        // For now, focus on search input if available
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        setIsOpen(false);
      },
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      color: 'from-red-500 to-red-600',
      onClick: () => {
        // Navigate to dashboard - notifications are shown in the header bell
        router.push(buildPath('dashboard'));
        setIsOpen(false);
        // Focus on notification bell if available
        setTimeout(() => {
          const bellButton = document.querySelector('[aria-label*="notification"], [aria-label*="Notification"]') as HTMLElement;
          if (bellButton) {
            bellButton.click();
          }
        }, 300);
      },
    },
    {
      id: 'calendar',
      label: 'Calendrier',
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-indigo-500 to-indigo-600',
      onClick: () => {
        // Navigate to agenda/calendar page
        router.push(buildPath('dashboard/agenda/calendrier'));
        setIsOpen(false);
      },
    },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Quick Actions Container */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Action Buttons (Fan Menu) */}
        <div className="relative">
          {isOpen && (
            <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2">
              {actions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className={`
                    group relative flex items-center gap-3 
                    animate-scale-in
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Label */}
                  <span className="
                    absolute right-16 
                    px-3 py-2 
                    bg-gray-900/90 backdrop-blur-md
                    text-white text-sm font-medium
                    rounded-lg
                    opacity-0 group-hover:opacity-100
                    transform translate-x-2 group-hover:translate-x-0
                    transition-all duration-200
                    whitespace-nowrap
                    pointer-events-none
                  ">
                    {action.label}
                  </span>

                  {/* Icon Button */}
                  <div className={`
                    w-12 h-12
                    bg-gradient-to-br ${action.color}
                    rounded-full
                    flex items-center justify-center
                    text-white
                    shadow-lg hover:shadow-xl
                    transform hover:scale-110
                    transition-all duration-200
                    cursor-pointer
                  `}>
                    {action.icon}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Main FAB Button */}
          <button
            onClick={toggleMenu}
            className={`
              w-16 h-16
              bg-gradient-to-br from-blue-500 to-purple-600
              rounded-full
              flex items-center justify-center
              text-white
              shadow-lg hover:shadow-2xl
              transform hover:scale-110 active:scale-95
              transition-all duration-300
              ${isOpen ? 'rotate-45' : 'rotate-0'}
            `}
            aria-label={isOpen ? 'Fermer le menu' : 'Actions rapides'}
          >
            {isOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <Plus className="w-7 h-7" />
            )}
          </button>

          {/* Pulse Animation Ring */}
          {!isOpen && (
            <div className="
              absolute inset-0 
              bg-gradient-to-br from-blue-500 to-purple-600
              rounded-full
              animate-ping
              opacity-20
              pointer-events-none
            " />
          )}
        </div>
      </div>
    </>
  );
}
