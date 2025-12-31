'use client';

import { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Archive, 
  Settings, 
  Star,
  MoreHorizontal,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    client: string;
    status: 'active' | 'completed' | 'on-hold';
    progress: number;
    startDate: string;
    endDate: string;
    isFavorite: boolean;
  };
}

const statusConfig = {
  active: {
    label: 'En cours',
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
    dot: 'bg-blue-500'
  },
  completed: {
    label: 'Terminé',
    color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
    dot: 'bg-green-500'
  },
  'on-hold': {
    label: 'En attente',
    color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500'
  }
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [isFavorite, setIsFavorite] = useState(project.isFavorite);

  const status = statusConfig[project.status];

  const handleSaveName = () => {
    setIsEditingName(false);
    // TODO: Save to API
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 mb-6"
    >
      {/* Top Row - Navigation & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Retour au dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`glass-button p-2 rounded-lg transition-all ${
              isFavorite ? 'text-yellow-500' : 'text-gray-400'
            }`}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/40 dark:hover:bg-white/10 transition-all"
            title="Partager"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Partager</span>
          </button>

          <button
            className="glass-button p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition-all"
            title="Plus d'actions"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Project Name & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="glass-input text-2xl font-bold px-3 py-1 rounded-lg flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setProjectName(project.name);
                    setIsEditingName(false);
                  }
                }}
              />
              <button
                onClick={handleSaveName}
                className="glass-button p-2 rounded-lg text-green-600 hover:bg-green-500/20"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setProjectName(project.name);
                  setIsEditingName(false);
                }}
                className="glass-button p-2 rounded-lg text-red-600 hover:bg-red-500/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                {projectName}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-accessible mt-1">
            Client: <span className="font-semibold">{project.client}</span>
          </p>
        </div>

        <div className={`glass-badge px-4 py-2 rounded-full border ${status.color} flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
          <span className="font-semibold text-sm">{status.label}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progression globale
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {project.progress}%
          </span>
        </div>
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-accessible">Début:</span>
          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
            {new Date(project.startDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
        <div>
          <span className="text-muted-accessible">Fin prévue:</span>
          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
            {new Date(project.endDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
