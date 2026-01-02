'use client';

/**
 * Bibliothèque de widgets - Modal pour ajouter des widgets
 */

import { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import { useDashboardStore } from '@/lib/dashboard/store';
import { widgetRegistry } from '@/lib/dashboard/widgetRegistry';
import { getFilteredWidgetRegistry } from '@/lib/dashboard/widgetPermissions';
import type { WidgetType } from '@/lib/dashboard/types';
import { customWidgetsAPI, type CustomWidget } from '@/lib/api/custom-widgets';
import { WidgetEditor } from './WidgetEditor';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  hasModuleAccess?: (module: string) => boolean; // Optional permission checker for ERP portal
}

const categoryLabels: Record<string, string> = {
  commercial: 'Commercial',
  projects: 'Projets',
  finances: 'Finances',
  performance: 'Performance',
  team: 'Équipe',
  system: 'Système',
};

export function WidgetLibrary({ isOpen, onClose, hasModuleAccess }: WidgetLibraryProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<number | undefined>();
  const { addWidget } = useDashboardStore();

  // Load custom widgets
  useEffect(() => {
    if (isOpen) {
      loadCustomWidgets();
    }
  }, [isOpen]);

  const loadCustomWidgets = async () => {
    try {
      setIsLoadingCustom(true);
      const widgets = await customWidgetsAPI.list({ include_public: true });
      setCustomWidgets(widgets);
    } catch (error) {
      logger.error('Error loading custom widgets', error);
      showToast({ message: 'Erreur lors du chargement des widgets personnalisés', type: 'error' });
    } finally {
      setIsLoadingCustom(false);
    }
  };

  // Filter widgets based on permissions if provided
  const filteredRegistry = useMemo(() => {
    if (hasModuleAccess) {
      return getFilteredWidgetRegistry(hasModuleAccess);
    }
    return widgetRegistry;
  }, [hasModuleAccess]);

  const categories = useMemo(() => {
    const cats = new Set(Object.values(filteredRegistry).map(w => w.category));
    return Array.from(cats);
  }, [filteredRegistry]);

  const handleAddWidget = (widgetType: WidgetType) => {
    const widgetDef = filteredRegistry[widgetType];
    if (!widgetDef) return;

    // Trouver la position disponible (en bas de la grille)
    const activeConfig = useDashboardStore.getState().getActiveConfig();
    const maxY = activeConfig?.layouts.reduce((max, w) => Math.max(max, w.y + w.h), 0) || 0;

    addWidget({
      widget_type: widgetType,
      x: 0,
      y: maxY,
      w: widgetDef.default_size.w,
      h: widgetDef.default_size.h,
      config: {
        period: 'month',
      },
    });

    onClose();
  };

  const handleAddCustomWidget = (customWidget: CustomWidget) => {
    // Trouver la position disponible (en bas de la grille)
    const activeConfig = useDashboardStore.getState().getActiveConfig();
    const maxY = activeConfig?.layouts.reduce((max, w) => Math.max(max, w.y + w.h), 0) || 0;

    addWidget({
      widget_type: 'custom' as WidgetType,
      x: 0,
      y: maxY,
      w: 4,
      h: 2,
      config: {
        widget_id: customWidget.id,
      },
    });

    onClose();
  };

  const handleEditCustomWidget = (widgetId: number) => {
    setEditingWidgetId(widgetId);
    setIsEditorOpen(true);
  };

  const handleDeleteCustomWidget = async (widgetId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
      return;
    }

    try {
      await customWidgetsAPI.delete(widgetId);
      showToast({ message: 'Widget supprimé avec succès', type: 'success' });
      loadCustomWidgets();
    } catch (error) {
      logger.error('Error deleting custom widget', error);
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleCreateWidget = () => {
    setEditingWidgetId(undefined);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingWidgetId(undefined);
    loadCustomWidgets();
  };

  const filteredWidgets = Object.values(filteredRegistry).filter((widget) => {
    const matchesSearch =
      searchQuery === '' ||
      widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || widget.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
      <div className="glass-modal rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bibliothèque de Widgets
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and filters */}
        <div className="p-6 border-b border-white/20 dark:border-white/10 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un widget..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tous
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Mes Widgets
            </button>
          </div>
        </div>

        {/* Widget grid */}
        <div className="flex-1 overflow-auto p-6">
          {/* Custom Widgets Section */}
          {selectedCategory === 'custom' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mes Widgets Personnalisés
                </h3>
                <button
                  onClick={handleCreateWidget}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Créer un Widget
                </button>
              </div>
              {isLoadingCustom ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : customWidgets.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Aucun widget personnalisé pour le moment
                  </p>
                  <button
                    onClick={handleCreateWidget}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Créer votre premier widget
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {customWidgets.map((customWidget) => (
                    <div
                      key={customWidget.id}
                      className="group relative bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {customWidget.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {customWidget.description || 'Widget personnalisé'}
                          </p>
                          {customWidget.is_public && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 mt-1 inline-block">
                              Public
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCustomWidget(customWidget.id)}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Modifier"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomWidget(customWidget.id)}
                          className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAddCustomWidget(customWidget)}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Ajouter au dashboard"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded">
                          {customWidget.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Standard Widgets */}
          {selectedCategory !== 'custom' && (
            <>
              {filteredWidgets.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun widget trouvé
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWidgets.map((widget) => {
                const Icon = widget.icon;
                const isImplemented = widget.component !== null;

                return (
                  <div
                    key={widget.id}
                    className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {widget.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {widget.description}
                        </p>
                        {!isImplemented && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            En développement
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddWidget(widget.id)}
                      disabled={!isImplemented}
                      className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
                        isImplemented
                          ? 'bg-blue-600 text-white opacity-0 group-hover:opacity-100 hover:bg-blue-700'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                      title={isImplemented ? 'Ajouter ce widget' : 'Widget en développement'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded">
                        {widget.default_size.w}×{widget.default_size.h}
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded">
                        {categoryLabels[widget.category] || widget.category}
                      </span>
                    </div>
                  </div>
                );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCategory === 'custom'
                ? `${customWidgets.length} widget${customWidgets.length !== 1 ? 's' : ''} personnalisé${customWidgets.length !== 1 ? 's' : ''}`
                : `${filteredWidgets.length} widget${filteredWidgets.length !== 1 ? 's' : ''} disponible${filteredWidgets.length !== 1 ? 's' : ''}`}
            </p>
            {selectedCategory !== 'custom' && (
              <button
                onClick={handleCreateWidget}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Créer un Widget
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Widget Editor Modal */}
      <WidgetEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        widgetId={editingWidgetId}
        onSave={loadCustomWidgets}
      />
    </div>
  );
}
