'use client';

/**
 * Bibliothèque de widgets pour le portail employé - Modal pour ajouter des widgets
 */

import { useState, useMemo } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';
import { employeePortalWidgetRegistry, getEmployeePortalWidget } from '@/lib/dashboard/employeePortalWidgetRegistry';
// Types handled inline

interface EmployeePortalWidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  projects: 'Projets',
  performance: 'Performance',
  system: 'Système',
};

export function EmployeePortalWidgetLibrary({ isOpen, onClose }: EmployeePortalWidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addWidget, getActiveConfig } = useEmployeePortalDashboardStore();

  const categories = useMemo(() => {
    const cats = new Set(Object.values(employeePortalWidgetRegistry).map(w => w.category));
    return Array.from(cats);
  }, []);

  const handleAddWidget = (widgetType: string) => {
    const widgetDef = employeePortalWidgetRegistry[widgetType];
    if (!widgetDef) return;

    const activeConfig = getActiveConfig();
    const maxY = activeConfig?.layouts.reduce((max, w) => Math.max(max, w.y + w.h), 0) || 0;

    addWidget({
      widget_type: widgetType as any,
      x: 0,
      y: maxY,
      w: widgetDef.default_size.w,
      h: widgetDef.default_size.h,
      config: {
        period: 'month',
        title: widgetDef.name,
      },
    });

    onClose();
  };

  const filteredWidgets = Object.values(employeePortalWidgetRegistry).filter((widget) => {
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
                return (
                  <button
                    key={widget.id}
                    onClick={() => handleAddWidget(widget.id)}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {widget.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {widget.default_size.w} × {widget.default_size.h}
                      </span>
                      <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
