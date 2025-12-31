'use client';

/**
 * Bibliothèque de widgets - Modal pour ajouter des widgets
 */

import { useState, useMemo } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { useDashboardStore } from '@/lib/dashboard/store';
import { widgetRegistry } from '@/lib/dashboard/widgetRegistry';
import { getFilteredWidgetRegistry } from '@/lib/dashboard/widgetPermissions';
import type { WidgetType } from '@/lib/dashboard/types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addWidget } = useDashboardStore();

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
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        {/* Widget grid */}
        <div className="flex-1 overflow-auto p-6">
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''} disponible
            {filteredWidgets.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
