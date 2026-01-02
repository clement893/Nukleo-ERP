'use client';

/**
 * Barre d'outils du dashboard du portail employé
 */

import { useState } from 'react';
import { Plus, Edit3, Save, LayoutGrid, Check } from 'lucide-react';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui';

interface EmployeePortalDashboardToolbarProps {
  onAddWidget: () => void;
}

export function EmployeePortalDashboardToolbar({ onAddWidget }: EmployeePortalDashboardToolbarProps) {
  const {
    configs,
    activeConfigId,
    isEditMode,
    setActiveConfig,
    setEditMode,
    getActiveConfig,
    saveToServer,
  } = useEmployeePortalDashboardStore();
  
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
    <div className="glass-navbar px-6 py-4 mb-6">
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
          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </Button>

          {lastSaved && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Check className="w-3 h-3 text-green-600" />
              Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* Edit mode toggle */}
          <Button
            onClick={handleToggleEditMode}
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            {isEditMode ? 'Terminer' : 'Personnaliser'}
          </Button>

          {/* Add widget button */}
          {isEditMode && (
            <Button
              onClick={onAddWidget}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter Widget
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
