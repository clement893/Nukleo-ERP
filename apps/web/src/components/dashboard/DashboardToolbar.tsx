'use client';

/**
 * Barre d'outils du dashboard personnalisable
 */

import { useState } from 'react';
import { Plus, Edit3, Save, LayoutGrid, Check } from 'lucide-react';
import { useDashboardStore } from '@/lib/dashboard/store';
import { DashboardFilters } from './DashboardFilters';
import { useToast } from '@/lib/toast';

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
    saveToServer,
  } = useDashboardStore();
  
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const activeConfig = getActiveConfig();

  const handleToggleEditMode = () => {
    setEditMode(!isEditMode);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveToServer();
      setLastSaved(new Date());
      showToast({
        message: 'Dashboard sauvegardé avec succès',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving dashboard:', error);
      showToast({
        message: 'Erreur lors de la sauvegarde du dashboard',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-navbar px-6 py-4">
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

        {/* Right: Filters and Actions */}
        <div className="flex items-center gap-2">
          {!isEditMode && <DashboardFilters />}
          
          {/* Save button - always visible */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isSaving
                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                : lastSaved
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={lastSaved ? `Dernière sauvegarde : ${lastSaved.toLocaleTimeString('fr-FR')}` : 'Sauvegarder les modifications'}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : lastSaved ? (
              <>
                <Check className="w-4 h-4" />
                Sauvegardé
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </button>
          
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
