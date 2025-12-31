/**
 * Store Zustand pour la gestion du dashboard personnalisable
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardConfig, WidgetLayout, GlobalFilters } from './types';
import { preferencesAPI } from '@/lib/api/preferences';

interface DashboardStore {
  // État
  configs: DashboardConfig[];
  activeConfigId: string | null;
  isEditMode: boolean;
  globalFilters: GlobalFilters;
  
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

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // État initial
      configs: [],
      activeConfigId: null,
      isEditMode: false,
      globalFilters: {},
      
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
        setTimeout(() => get().saveToServer(), 500);
      },
      
      updateConfig: (id, updates) => {
        set((state) => ({
          configs: state.configs.map(c => 
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
        }));
        // Sauvegarder automatiquement après mise à jour de config
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
      },
      
      setActiveConfig: (id) => {
        set({ activeConfigId: id });
        // Sauvegarder automatiquement après changement de config active
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
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
        setTimeout(() => get().saveToServer(), 500);
      },
      
      // Actions - Filtres globaux
      setGlobalFilters: (filters) => set({ globalFilters: filters }),
      
      clearGlobalFilters: () => set({ globalFilters: {} }),
      
      // Actions - Mode édition
      setEditMode: (isEditMode) => set({ isEditMode }),
      
      // Actions - Persistance
      saveToServer: async () => {
        try {
          const { configs, activeConfigId, globalFilters } = get();
          await preferencesAPI.set('dashboard_configs', {
            configs,
            activeConfigId,
            globalFilters,
          });
        } catch (error) {
          console.error('Error saving dashboard to server:', error);
          // Ne pas bloquer l'utilisateur si la sauvegarde échoue
        }
      },
      
      loadFromServer: async () => {
        try {
          const preference = await preferencesAPI.get('dashboard_configs');
          if (preference && preference.value && typeof preference.value === 'object') {
            const data = preference.value as {
              configs?: DashboardConfig[];
              activeConfigId?: string | null;
              globalFilters?: GlobalFilters;
            };
            
            if (data.configs && Array.isArray(data.configs) && data.configs.length > 0) {
              set({
                configs: data.configs,
                activeConfigId: data.activeConfigId || null,
                globalFilters: data.globalFilters || {},
              });
            }
          }
        } catch (error) {
          console.error('Error loading dashboard from server:', error);
          // Continuer avec les données du localStorage si le chargement échoue
        }
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        configs: state.configs,
        activeConfigId: state.activeConfigId,
        globalFilters: state.globalFilters,
      }),
    }
  )
);
