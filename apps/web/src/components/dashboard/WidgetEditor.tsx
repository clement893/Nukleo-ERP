'use client';

/**
 * Éditeur de Widgets Personnalisés
 * Permet de créer et modifier des widgets personnalisés
 */

import { useState, useEffect } from 'react';
import { X, Save, Eye, Code, Palette } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal } from '@/components/ui';
import { customWidgetsAPI, type CustomWidgetCreate, type CustomWidgetUpdate } from '@/lib/api/custom-widgets';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';
import DOMPurify from 'isomorphic-dompurify';

interface WidgetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId?: number; // Si fourni, on édite un widget existant
  onSave?: () => void; // Callback après sauvegarde
}

export function WidgetEditor({ isOpen, onClose, widgetId, onSave }: WidgetEditorProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'style' | 'preview'>('config');
  
  // État du formulaire
  const [formData, setFormData] = useState<CustomWidgetCreate>({
    name: '',
    description: '',
    type: 'html',
    config: {
      html_content: '',
      css_content: '',
    },
    style: {},
    is_public: false,
  });

  // Charger le widget existant si on est en mode édition
  useEffect(() => {
    if (isOpen && widgetId) {
      loadWidget();
    } else if (isOpen && !widgetId) {
      // Réinitialiser le formulaire pour un nouveau widget
      setFormData({
        name: '',
        description: '',
        type: 'html',
        config: {
          html_content: '',
          css_content: '',
        },
        style: {},
        is_public: false,
      });
      setActiveTab('config');
    }
  }, [isOpen, widgetId]);

  const loadWidget = async () => {
    if (!widgetId) return;
    
    try {
      setIsLoading(true);
      const widget = await customWidgetsAPI.get(widgetId);
      setFormData({
        name: widget.name,
        description: widget.description || '',
        type: widget.type,
        config: widget.config,
        data_source: widget.data_source,
        style: widget.style,
        is_public: widget.is_public,
      });
    } catch (error) {
      logger.error('Error loading widget', error);
      showToast({ message: 'Erreur lors du chargement du widget', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (widgetId) {
        // Mise à jour
        const update: CustomWidgetUpdate = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          config: formData.config,
          data_source: formData.data_source,
          style: formData.style,
          is_public: formData.is_public,
        };
        await customWidgetsAPI.update(widgetId, update);
        showToast({ message: 'Widget mis à jour avec succès', type: 'success' });
      } else {
        // Création
        await customWidgetsAPI.create(formData);
        showToast({ message: 'Widget créé avec succès', type: 'success' });
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      logger.error('Error saving widget', error);
      showToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {widgetId ? 'Modifier le Widget' : 'Créer un Widget Personnalisé'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'style'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            Style
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Aperçu
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'config' && (
                <div className="space-y-6">
                  {/* Informations de base */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Informations de base
                    </h3>
                    <Input
                      label="Nom du widget"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Mon widget personnalisé"
                      required
                    />
                    <Textarea
                      label="Description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description du widget..."
                      rows={3}
                    />
                    <Select
                      label="Type de widget"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      options={[
                        { value: 'html', label: 'HTML/CSS' },
                        { value: 'text', label: 'Texte/Markdown' },
                        { value: 'api', label: 'Requête API' },
                        { value: 'chart', label: 'Graphique' },
                        { value: 'iframe', label: 'Iframe' },
                      ]}
                    />
                  </div>

                  {/* Configuration selon le type */}
                  {formData.type === 'html' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Contenu HTML
                      </h3>
                      <Textarea
                        label="HTML"
                        value={formData.config.html_content || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, html_content: e.target.value },
                          })
                        }
                        placeholder="<div>Votre contenu HTML...</div>"
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <Textarea
                        label="CSS (optionnel)"
                        value={formData.config.css_content || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, css_content: e.target.value },
                          })
                        }
                        placeholder=".widget { color: blue; }"
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  {formData.type === 'text' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Contenu texte
                      </h3>
                      <Select
                        label="Format"
                        value={formData.config.text_format || 'markdown'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, text_format: e.target.value as any },
                          })
                        }
                        options={[
                          { value: 'markdown', label: 'Markdown' },
                          { value: 'html', label: 'HTML' },
                          { value: 'plain', label: 'Texte brut' },
                        ]}
                      />
                      <Textarea
                        label="Contenu"
                        value={formData.config.text_content || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, text_content: e.target.value },
                          })
                        }
                        placeholder="Votre contenu..."
                        rows={10}
                      />
                    </div>
                  )}

                  {formData.type === 'api' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Configuration API
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Endpoint API"
                          value={formData.data_source?.endpoint || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_source: {
                                ...formData.data_source,
                                type: 'api',
                                endpoint: e.target.value,
                                method: formData.data_source?.method || 'GET',
                              },
                            })
                          }
                          placeholder="/v1/projects"
                        />
                        <Select
                          label="Méthode HTTP"
                          value={formData.data_source?.method || 'GET'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_source: {
                                ...formData.data_source,
                                type: 'api',
                                method: e.target.value,
                                endpoint: formData.data_source?.endpoint || '',
                              },
                            })
                          }
                          options={[
                            { value: 'GET', label: 'GET' },
                            { value: 'POST', label: 'POST' },
                            { value: 'PUT', label: 'PUT' },
                          ]}
                        />
                      </div>
                      <Input
                        label="Chemin des données (optionnel)"
                        value={formData.data_source?.data_path || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            data_source: {
                              ...formData.data_source,
                              type: 'api',
                              data_path: e.target.value,
                              endpoint: formData.data_source?.endpoint || '',
                              method: formData.data_source?.method || 'GET',
                            },
                          })
                        }
                        placeholder="data.items"
                        helpText="Ex: data.items pour extraire items depuis {data: {items: [...]}}"
                      />
                      <Textarea
                        label="Template HTML (optionnel)"
                        value={formData.config.template || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, template: e.target.value },
                          })
                        }
                        placeholder='<div><h3>{{name}}</h3><p>{{description}}</p></div>'
                        rows={6}
                        className="font-mono text-sm"
                        helpText="Utilisez {{variable}} pour insérer les valeurs des données"
                      />
                    </div>
                  )}

                  {formData.type === 'chart' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Configuration Graphique
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Type de graphique"
                          value={formData.config.chart_type || 'line'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              config: { ...formData.config, chart_type: e.target.value },
                            })
                          }
                          options={[
                            { value: 'line', label: 'Ligne' },
                            { value: 'bar', label: 'Barres' },
                            { value: 'area', label: 'Aire' },
                            { value: 'pie', label: 'Camembert' },
                          ]}
                        />
                        <Input
                          label="Endpoint API"
                          value={formData.data_source?.endpoint || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_source: {
                                ...formData.data_source,
                                type: 'api',
                                endpoint: e.target.value,
                                method: 'GET',
                              },
                            })
                          }
                          placeholder="/v1/finances/revenue"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Axe X (clé)"
                          value={formData.config.chart_config?.x_axis || 'x'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              config: {
                                ...formData.config,
                                chart_config: {
                                  ...formData.config.chart_config,
                                  x_axis: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="month"
                        />
                        <Input
                          label="Axe Y (clé)"
                          value={formData.config.chart_config?.y_axis || 'y'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              config: {
                                ...formData.config,
                                chart_config: {
                                  ...formData.config.chart_config,
                                  y_axis: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="value"
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === 'iframe' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Configuration Iframe
                      </h3>
                      <Input
                        label="URL de l'iframe"
                        value={formData.config.iframe_url || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, iframe_url: e.target.value },
                          })
                        }
                        placeholder="https://example.com/dashboard"
                        type="url"
                        required
                      />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Permissions Sandbox (sécurité)
                        </label>
                        <div className="space-y-2">
                          {[
                            { value: 'allow-scripts', label: 'Autoriser les scripts' },
                            { value: 'allow-same-origin', label: 'Autoriser la même origine' },
                            { value: 'allow-forms', label: 'Autoriser les formulaires' },
                            { value: 'allow-popups', label: 'Autoriser les popups' },
                            { value: 'allow-popups-to-escape-sandbox', label: 'Permettre aux popups de sortir du sandbox' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.config.iframe_sandbox?.includes(option.value) ?? (option.value === 'allow-scripts' || option.value === 'allow-same-origin')}
                                onChange={(e) => {
                                  const current = formData.config.iframe_sandbox || [];
                                  const updated = e.target.checked
                                    ? [...current, option.value]
                                    : current.filter((v) => v !== option.value);
                                  setFormData({
                                    ...formData,
                                    config: { ...formData.config, iframe_sandbox: updated },
                                  });
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Les permissions sandbox limitent ce que l'iframe peut faire pour la sécurité.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Options avancées */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Options
                    </h3>
                    <Input
                      label="Intervalle de rafraîchissement (secondes)"
                      type="number"
                      value={formData.config.refresh_interval || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            refresh_interval: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="60"
                      helpText="Laissez vide pour désactiver le rafraîchissement automatique"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Rendre ce widget public (partageable avec d'autres utilisateurs)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Personnalisation du style
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Couleur de fond"
                      type="color"
                      value={formData.style?.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, backgroundColor: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="Couleur du texte"
                      type="color"
                      value={formData.style?.textColor || '#000000'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, textColor: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="Couleur de bordure"
                      type="color"
                      value={formData.style?.borderColor || '#e5e7eb'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, borderColor: e.target.value },
                        })
                      }
                    />
                    <Input
                      label="Rayon de bordure (px)"
                      type="number"
                      value={formData.style?.borderRadius || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, borderRadius: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                    <Input
                      label="Padding (px)"
                      type="number"
                      value={formData.style?.padding || 16}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, padding: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                    <Input
                      label="Taille de police (px)"
                      type="number"
                      value={formData.style?.fontSize || 14}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, fontSize: parseInt(e.target.value) || 14 },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Aperçu
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-[400px]">
                    {formData.type === 'html' && (
                      <div>
                        {formData.config.html_content && (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(formData.config.html_content),
                            }}
                          />
                        )}
                        {formData.config.css_content && (
                          <style>{formData.config.css_content}</style>
                        )}
                      </div>
                    )}
                    {formData.type === 'text' && (
                      <div className="prose dark:prose-invert max-w-none">
                        {formData.config.text_content || 'Aucun contenu'}
                      </div>
                    )}
                    {formData.type === 'iframe' && formData.config.iframe_url && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <iframe
                          src={formData.config.iframe_url}
                          className="w-full h-96 border-0"
                          sandbox={(formData.config.iframe_sandbox?.join(' ') || 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox')}
                          title="Preview"
                        />
                      </div>
                    )}
                    {formData.type === 'api' && (
                      <div>
                        {formData.data_source?.endpoint ? (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                              <strong>Endpoint:</strong> {formData.data_source.endpoint}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Les données seront chargées depuis cet endpoint lors de l'affichage du widget.
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">Configurez un endpoint API pour voir l'aperçu</p>
                        )}
                      </div>
                    )}
                    {formData.type === 'chart' && (
                      <div>
                        {formData.data_source?.endpoint ? (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                              <strong>Type:</strong> {formData.config.chart_type || 'line'}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Le graphique sera généré à partir des données de l'endpoint.
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">Configurez un endpoint API pour voir l'aperçu</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim()}
            loading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {widgetId ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
