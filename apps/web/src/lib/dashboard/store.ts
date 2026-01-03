/**
 * Store Zustand pour la gestion du dashboard personnalisable
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardConfig, WidgetLayout, GlobalFilters } from './types';
import { preferencesAPI } from '@/lib/api/preferences';

// Debounce pour éviter trop de sauvegardes
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (saveFn: () => Promise<void>, delay: number = 1000) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveFn().catch(console.error);
    saveTimeout = null;
  }, delay);
};

// Type pour le contexte du dashboard (page/module)
export type DashboardContext = 'main' | 'commercial' | 'projects' | 'finances' | 'team' | 'system' | 'erp' | 'reseau' | 'management';

// Fonction pour obtenir la clé de préférence basée sur le contexte
const getPreferenceKey = (context: DashboardContext): string => {
  switch (context) {
    case 'commercial':
      return 'dashboard_commercial_configs';
    case 'projects':
      return 'dashboard_projects_configs';
    case 'finances':
      return 'dashboard_finances_configs';
    case 'team':
      return 'dashboard_team_configs';
    case 'system':
      return 'dashboard_system_configs';
    case 'erp':
      return 'dashboard_erp_configs';
    case 'reseau':
      return 'dashboard_reseau_configs';
    case 'management':
      return 'dashboard_management_configs';
    case 'main':
    default:
      return 'dashboard_configs';
  }
};

interface DashboardStore {
  // État
  context: DashboardContext;
  configs: DashboardConfig[];
  activeConfigId: string | null;
  isEditMode: boolean;
  globalFilters: GlobalFilters;
  
  // Actions - Contexte
  setContext: (context: DashboardContext) => Promise<void>;
  
  // Getters
  getActiveConfig: () => DashboardConfig | null;
  getConfigById: (id: string) => DashboardConfig | null;
  
  // Actions - Configurations
  setConfigs: (configs: DashboardConfig[]) => void;
  addConfig: (config: DashboardConfig) => void;
  updateConfig: (id: string, updates: Partial<DashboardConfig>) => void;
  deleteConfig: (id: string) => void;
  setActiveConfig: (id: string) => void;
  duplicateConfig: (id: string) => void;
  
  // Actions - Widgets
  addWidget: (widget: Omit<WidgetLayout, 'id'>) => void;
  updateWidget: (id: string, updates: Partial<WidgetLayout>) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, w: number, h: number) => void;
  
  // Actions - Filtres globaux
  setGlobalFilters: (filters: GlobalFilters) => void;
  clearGlobalFilters: () => void;
  
  // Actions - Mode édition
  setEditMode: (isEditMode: boolean) => void;
  
  // Actions - Persistance
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

// Créer un store par contexte pour éviter les conflits
const createDashboardStore = (contextKey: DashboardContext) => {
  return create<DashboardStore>()(
    persist(
      (set, get) => ({
        // État initial
        context: contextKey,
        configs: [],
        activeConfigId: null,
        isEditMode: false,
        globalFilters: {},
        
        // Actions - Contexte
        setContext: async (context) => {
          const currentContext = get().context;
          
          // Si on change de contexte, sauvegarder l'état actuel
          if (currentContext !== context) {
            await get().saveToServer().catch(console.error);
            
            // Réinitialiser l'état pour le nouveau contexte
            set({ 
              context,
              configs: [],
              activeConfigId: null,
              globalFilters: {},
            });
            
            // Charger les configs du nouveau contexte
            await get().loadFromServer().catch(console.error);
          }
        },
      
      // Getters
      getActiveConfig: () => {
        const { configs, activeConfigId } = get();
        return configs.find(c => c.id === activeConfigId) || null;
      },
      
      getConfigById: (id: string) => {
        const { configs } = get();
        return configs.find(c => c.id === id) || null;
      },
      
      // Actions - Configurations
      setConfigs: (configs) => set({ configs }),
      
      addConfig: (config) => {
        set((state) => ({
          configs: [...state.configs, config],
          activeConfigId: config.id,
        }));
        // Sauvegarder automatiquement après ajout de config
        debouncedSave(() => get().saveToServer());
      },
      
      updateConfig: (id, updates) => {
        set((state) => ({
          configs: state.configs.map(c => 
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
        }));
        // Sauvegarder automatiquement après mise à jour de config
        debouncedSave(() => get().saveToServer());
      },
      
      deleteConfig: (id) => {
        set((state) => {
          const newConfigs = state.configs.filter(c => c.id !== id);
          const newActiveId = state.activeConfigId === id 
            ? (newConfigs[0]?.id || null)
            : state.activeConfigId;
          
          return {
            configs: newConfigs,
            activeConfigId: newActiveId,
          };
        });
        // Sauvegarder automatiquement après suppression de config
        debouncedSave(() => get().saveToServer());
      },
      
      setActiveConfig: (id) => {
        set({ activeConfigId: id });
        // Sauvegarder automatiquement après changement de config active
        debouncedSave(() => get().saveToServer());
      },
      
      duplicateConfig: (id) => {
        set((state) => {
          const config = state.configs.find(c => c.id === id);
          if (!config) return state;
          
          const newConfig: DashboardConfig = {
            ...config,
            id: `${config.id}-copy-${Date.now()}`,
            name: `${config.name} (Copie)`,
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          return {
            configs: [...state.configs, newConfig],
            activeConfigId: newConfig.id,
          };
        });
        // Sauvegarder automatiquement après duplication de config
        debouncedSave(() => get().saveToServer());
      },
      
      // Actions - Widgets
      addWidget: (widget) => {
        set((state) => {
          const activeConfig = state.getActiveConfig();
          if (!activeConfig) return state;
          
          const newWidget: WidgetLayout = {
            ...widget,
            id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
          
          const updatedLayouts = [...activeConfig.layouts, newWidget];
          
          return {
            configs: state.configs.map(c =>
              c.id === activeConfig.id
                ? { ...c, layouts: updatedLayouts, updated_at: new Date().toISOString() }
                : c
            ),
          };
        });
        // Sauvegarder automatiquement après ajout de widget
        debouncedSave(() => get().saveToServer());
      },
      
      updateWidget: (id, updates) => {
        set((state) => {
          const activeConfig = state.getActiveConfig();
          if (!activeConfig) return state;
          
          const updatedLayouts = activeConfig.layouts.map(w =>
            w.id === id ? { ...w, ...updates } : w
          );
          
          return {
            configs: state.configs.map(c =>
              c.id === activeConfig.id
                ? { ...c, layouts: updatedLayouts, updated_at: new Date().toISOString() }
                : c
            ),
          };
        });
        // Sauvegarder automatiquement après mise à jour de widget
        debouncedSave(() => get().saveToServer());
      },
      
      removeWidget: (id) => {
        set((state) => {
          const activeConfig = state.getActiveConfig();
          if (!activeConfig) return state;
          
          const updatedLayouts = activeConfig.layouts.filter(w => w.id !== id);
          
          return {
            configs: state.configs.map(c =>
              c.id === activeConfig.id
                ? { ...c, layouts: updatedLayouts, updated_at: new Date().toISOString() }
                : c
            ),
          };
        });
        // Sauvegarder automatiquement après suppression de widget
        debouncedSave(() => get().saveToServer());
      },
      
      updateWidgetPosition: (id, x, y) => {
        set((state) => {
          const activeConfig = state.getActiveConfig();
          if (!activeConfig) return state;
          
          const updatedLayouts = activeConfig.layouts.map(w =>
            w.id === id ? { ...w, x, y } : w
          );
          
          return {
            configs: state.configs.map(c =>
              c.id === activeConfig.id
                ? { ...c, layouts: updatedLayouts, updated_at: new Date().toISOString() }
                : c
            ),
          };
        });
        // Sauvegarder automatiquement après changement de position
        debouncedSave(() => get().saveToServer());
      },
      
      updateWidgetSize: (id, w, h) => {
        set((state) => {
          const activeConfig = state.getActiveConfig();
          if (!activeConfig) return state;
          
          const updatedLayouts = activeConfig.layouts.map(widget =>
            widget.id === id ? { ...widget, w, h } : widget
          );
          
          return {
            configs: state.configs.map(c =>
              c.id === activeConfig.id
                ? { ...c, layouts: updatedLayouts, updated_at: new Date().toISOString() }
                : c
            ),
          };
        });
        // Sauvegarder automatiquement après changement de taille
        debouncedSave(() => get().saveToServer());
      },
      
      // Actions - Filtres globaux
      setGlobalFilters: (filters) => set({ globalFilters: filters }),
      
      clearGlobalFilters: () => set({ globalFilters: {} }),
      
      // Actions - Mode édition
      setEditMode: (isEditMode) => {
        set({ isEditMode });
        // Sauvegarder automatiquement quand on quitte le mode édition
        if (!isEditMode) {
          // Sauvegarder immédiatement (sans debounce) quand on quitte le mode édition
          get().saveToServer().catch(console.error);
        }
      },
      
      // Actions - Persistance
      saveToServer: async () => {
        try {
          const { context, configs, activeConfigId, globalFilters } = get();
          const preferenceKey = getPreferenceKey(context);
          console.log('[DashboardStore] Saving to server:', { 
            context,
            preferenceKey,
            configsCount: configs.length, 
            activeConfigId,
            widgetsCount: configs.find(c => c.id === activeConfigId)?.layouts.length || 0
          });
          await preferencesAPI.set(preferenceKey, {
            configs,
            activeConfigId,
            globalFilters,
          });
          console.log('[DashboardStore] Successfully saved to server');
        } catch (error) {
          console.error('[DashboardStore] Error saving dashboard to server:', error);
          // The Zustand persist middleware will still save to localStorage
          // So the data is not lost, it just won't be synced to the server
          // We'll retry on next change or when loadFromServer is called
        }
      },
      
      loadFromServer: async () => {
        try {
          const { context } = get();
          const preferenceKey = getPreferenceKey(context);
          console.log('[DashboardStore] Loading from server...', { context, preferenceKey });
          const preference = await preferencesAPI.get(preferenceKey);
          const currentState = get();
          
          if (preference && preference.value && typeof preference.value === 'object') {
            const data = preference.value as {
              configs?: DashboardConfig[];
              activeConfigId?: string | null;
              globalFilters?: GlobalFilters;
            };
            
            if (data.configs && Array.isArray(data.configs) && data.configs.length > 0) {
              // Comparer les timestamps pour déterminer quelle version est la plus récente
              const serverLatestUpdate = Math.max(
                ...data.configs.map(c => new Date(c.updated_at || c.created_at || 0).getTime())
              );
              const localLatestUpdate = currentState.configs.length > 0
                ? Math.max(
                    ...currentState.configs.map(c => new Date(c.updated_at || c.created_at || 0).getTime())
                  )
                : 0;
              
              console.log('[DashboardStore] Comparing versions:', {
                serverLatest: new Date(serverLatestUpdate).toISOString(),
                localLatest: new Date(localLatestUpdate).toISOString(),
                serverNewer: serverLatestUpdate >= localLatestUpdate
              });
              
              // Utiliser la version la plus récente
              if (serverLatestUpdate >= localLatestUpdate) {
                // Les données serveur sont plus récentes ou égales
                console.log('[DashboardStore] Using server data');
                set({
                  configs: data.configs,
                  activeConfigId: data.activeConfigId || currentState.activeConfigId || null,
                  globalFilters: data.globalFilters || currentState.globalFilters || {},
                });
              } else if (currentState.configs.length > 0) {
                // Les données locales sont plus récentes, sauvegarder sur le serveur
                console.log('[DashboardStore] Local data is newer, saving to server');
                await get().saveToServer();
              }
            } else if (currentState.configs.length > 0) {
              // Si le serveur n'a pas de données mais localStorage oui, sauvegarder sur le serveur
              console.log('[DashboardStore] No server data, saving local data to server');
              await get().saveToServer();
            }
          } else {
            // Si pas de données serveur, sauvegarder les données locales si elles existent
            if (currentState.configs.length > 0) {
              console.log('[DashboardStore] No server preference, saving local data to server');
              await get().saveToServer();
            }
          }
          console.log('[DashboardStore] Load from server completed');
        } catch (error) {
          console.error('[DashboardStore] Error loading dashboard from server:', error);
          // Continuer avec les données du localStorage si le chargement échoue
        }
      },
      }),
      {
        name: `dashboard-storage-${contextKey}`, // Clé unique par contexte
        partialize: (state) => ({
          context: state.context,
          configs: state.configs,
          activeConfigId: state.activeConfigId,
          globalFilters: state.globalFilters,
        }),
      }
    )
  );
};

// Stores séparés par contexte pour éviter les conflits
// Chaque store est un hook Zustand créé avec create()
const stores: Record<DashboardContext, ReturnType<typeof createDashboardStore>> = {
  main: createDashboardStore('main'),
  commercial: createDashboardStore('commercial'),
  projects: createDashboardStore('projects'),
  finances: createDashboardStore('finances'),
  team: createDashboardStore('team'),
  system: createDashboardStore('system'),
  erp: createDashboardStore('erp'),
  reseau: createDashboardStore('reseau'),
  management: createDashboardStore('management'),
};

// Hook principal qui retourne le bon store selon le contexte
export const useDashboardStore = (context: DashboardContext = 'main') => {
  // Retourner le hook du store correspondant au contexte
  return stores[context]();
};
