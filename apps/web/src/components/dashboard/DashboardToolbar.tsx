'use client';

/**
 * Barre d'outils du dashboard personnalisable
 */

import React, { useState } from 'react';
import { Plus, Edit3, Save, X, LayoutGrid } from 'lucide-react';
import { useDashboardStore } from '@/lib/dashboard/store';

interface DashboardToolbarProps {
  onAddWidget: () => void;
}

export function DashboardToolbar({ onAddWidget }: DashboardToolbarProps) {
  const {
    configs,
    activeConfigId,
    isEditMode,
    setActiveConfig,
    setEditMode,
    getActiveConfig,
  } = useDashboardStore();

  const activeConfig = getActiveConfig();

  const handleToggleEditMode = () => {
    setEditMode(!isEditMode);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Config selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={activeConfigId || ''}
              onChange={(e) => setActiveConfig(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {configs.length === 0 && (
                <option value="">Aucune configuration</option>
              )}
              {configs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                  {config.is_default && ' (Par défaut)'}
                </option>
              ))}
            </select>
          </div>

          {activeConfig && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activeConfig.layouts.length} widget{activeConfig.layouts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <button
                onClick={onAddWidget}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un widget
              </button>
              
              <button
                onClick={handleToggleEditMode}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                <Save className="w-4 h-4" />
                Terminer
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleEditMode}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Personnaliser
            </button>
          )}
        </div>
      </div>

      {/* Edit mode banner */}
      {isEditMode && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Mode édition activé :</strong> Glissez-déposez les widgets pour les réorganiser, 
            redimensionnez-les par les coins, ou supprimez-les avec le bouton ×
          </p>
        </div>
      )}
    </div>
  );
}
