'use client';

/**
 * Widgets and Collections Manager Component
 * 
 * Admin component for managing dashboard widgets and collections
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Layers, BarChart3 } from 'lucide-react';
import { Button, Card, Input, Textarea, Select, Modal, Alert, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import { widgetRegistry } from '@/lib/dashboard/widgetRegistry';
import { getAvailableCollections, type WidgetCollection } from '@/lib/dashboard/widgetCollections';
import type { WidgetType, DashboardModule } from '@/lib/dashboard/types';
import { moduleLabels } from '@/lib/dashboard/widgetCollections';

interface WidgetsCollectionsManagerProps {
  className?: string;
}

export function WidgetsCollectionsManager({ className }: WidgetsCollectionsManagerProps) {
  const [activeTab, setActiveTab] = useState<'widgets' | 'collections'>('collections');
  const [collections, setCollections] = useState<WidgetCollection[]>([]);
  const widgets = widgetRegistry;
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<WidgetCollection | null>(null);
  const [formData, setFormData] = useState<Partial<WidgetCollection>>({
    name: '',
    description: '',
    module: 'commercial',
    color: 'blue',
    widgetTypes: [],
  });

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = () => {
    // In a real app, this would fetch from an API
    // For now, we'll use the static collections
    setCollections(getAvailableCollections());
  };

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      module: 'commercial',
      color: 'blue',
      widgetTypes: [],
    });
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection: WidgetCollection) => {
    setEditingCollection(collection);
    setFormData(collection);
    setIsCollectionModalOpen(true);
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette collection ?`)) {
      return;
    }

    // In a real app, this would call an API
    // For now, we'll just remove from local state
    setCollections(collections.filter(c => c.id !== collectionId));
  };

  const handleSaveCollection = () => {
    if (!formData.name || !formData.module) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const collectionData: WidgetCollection = {
      id: editingCollection?.id || `collection-${Date.now()}`,
      name: formData.name!,
      description: formData.description || '',
      module: formData.module as DashboardModule,
      color: formData.color || 'blue',
      widgetTypes: formData.widgetTypes || [],
    };

    if (editingCollection) {
      // Update existing
      setCollections(collections.map(c => c.id === editingCollection.id ? collectionData : c));
    } else {
      // Create new
      setCollections([...collections, collectionData]);
    }

    setIsCollectionModalOpen(false);
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      module: 'commercial',
      color: 'blue',
      widgetTypes: [],
    });
  };

  const availableWidgetTypes = Object.keys(widgetRegistry) as WidgetType[];
  const colorOptions = ['blue', 'purple', 'green', 'indigo', 'orange', 'amber', 'teal', 'emerald', 'gray'] as const;

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'widgets' | 'collections')}>
        <div className="flex items-center justify-between mb-6">
          <TabList>
            <Tab value="collections">
              <Layers className="w-4 h-4 mr-2" />
              Collections
            </Tab>
            <Tab value="widgets">
              <BarChart3 className="w-4 h-4 mr-2" />
              Widgets
            </Tab>
          </TabList>
          {activeTab === 'collections' && (
            <Button onClick={handleCreateCollection} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Collection
            </Button>
          )}
        </div>

        <TabPanels>
          <TabPanel value="collections" className="space-y-4">
          <Alert variant="info" className="mb-4">
            Les collections organisent les widgets par thème. Vous pouvez créer, modifier et supprimer des collections.
            Note: Les modifications ne sont pas encore persistées dans la base de données.
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <Card key={collection.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {collection.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {moduleLabels[collection.module]}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {collection.widgetTypes.length} widget{collection.widgetTypes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCollection(collection)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCollection(collection.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          </TabPanel>

          <TabPanel value="widgets" className="space-y-4">
          <Alert variant="info" className="mb-4">
            Liste de tous les widgets disponibles dans le système. Les widgets sont définis dans le code et ne peuvent pas être supprimés depuis cette interface.
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(widgets).map((widget) => (
              <Card key={widget.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <widget.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {widget.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {widget.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {widget.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {widget.default_size.w}×{widget.default_size.h}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Collection Modal */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        title={editingCollection ? 'Modifier la Collection' : 'Nouvelle Collection'}
      >
        <div className="space-y-4">
          <Input
            label="Nom de la collection"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <Select
            label="Module"
            value={formData.module}
            onChange={(e) => setFormData({ ...formData, module: e.target.value as DashboardModule })}
            options={Object.entries(moduleLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            required
          />

          <Select
            label="Couleur"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value as typeof colorOptions[number] })}
            options={colorOptions.map(color => ({
              value: color,
              label: color.charAt(0).toUpperCase() + color.slice(1),
            }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Widgets ({formData.widgetTypes?.length || 0} sélectionnés)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-60 overflow-y-auto">
              {availableWidgetTypes.map((widgetType) => {
                const widget = widgetRegistry[widgetType];
                const isSelected = formData.widgetTypes?.includes(widgetType);
                return (
                  <label
                    key={widgetType}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = formData.widgetTypes || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, widgetTypes: [...current, widgetType] });
                        } else {
                          setFormData({ ...formData, widgetTypes: current.filter(w => w !== widgetType) });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <widget.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{widget.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCollectionModalOpen(false);
                setEditingCollection(null);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveCollection}>
              <Save className="w-4 h-4 mr-2" />
              {editingCollection ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
