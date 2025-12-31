'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  FolderOpen, 
  Users, 
  Activity 
} from 'lucide-react';

export type TabId = 'overview' | 'tasks' | 'timeline' | 'files' | 'team' | 'activity';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  count?: number;
}

interface ProjectTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  counts?: {
    tasks?: number;
    files?: number;
    team?: number;
  };
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'files', label: 'Fichiers', icon: FolderOpen },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'activity', label: 'Activité', icon: Activity },
];

export function ProjectTabs({ activeTab, onTabChange, counts }: ProjectTabsProps) {
  return (
    <div className="glass-card rounded-xl p-2 mb-6">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id as keyof typeof counts];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/30"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
