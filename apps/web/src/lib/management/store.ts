/**
 * Zustand Store for Management Dashboard Widgets Configuration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ManagementWidgetConfig, ManagementDashboardConfig } from './types';

interface ManagementDashboardStore {
  configs: ManagementDashboardConfig[];
  activeConfig: string | null;
  isEditMode: boolean;
  
  // Widget management
  addWidget: (widget: ManagementWidgetConfig) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<ManagementWidgetConfig>) => void;
  updateLayout: (layouts: ManagementWidgetConfig[]) => void;
  
  // Config management
  addConfig: (config: ManagementDashboardConfig) => void;
  setActiveConfig: (id: string) => void;
  setEditMode: (enabled: boolean) => void;
  
  // Persistence
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
}

const defaultConfig: ManagementDashboardConfig = {
  id: 'default',
  name: 'Management Dashboard',
  layouts: [
    {
      id: 'widget-1',
      widget_type: 'employees-stats',
      x: 0,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      id: 'widget-2',
      widget_type: 'time-tracking-summary',
      x: 4,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      id: 'widget-3',
      widget_type: 'vacation-overview',
      x: 8,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      id: 'widget-4',
      widget_type: 'pending-requests',
      x: 0,
      y: 2,
      w: 6,
      h: 3,
    },
    {
      id: 'widget-5',
      widget_type: 'upcoming-vacations',
      x: 6,
      y: 2,
      w: 6,
      h: 3,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useManagementDashboardStore = create<ManagementDashboardStore>()(
  persist(
    (set, get) => ({
      configs: [defaultConfig],
      activeConfig: 'default',
      isEditMode: false,

      addWidget: (widget) => {
        const state = get();
        const activeConfigId = state.activeConfig || 'default';
        const config = state.configs.find(c => c.id === activeConfigId);
        
        if (config) {
          const updatedConfig = {
            ...config,
            layouts: [...config.layouts, widget],
            updated_at: new Date().toISOString(),
          };
          
          set({
            configs: state.configs.map(c => 
              c.id === activeConfigId ? updatedConfig : c
            ),
          });
        }
      },

      removeWidget: (id) => {
        const state = get();
        const activeConfigId = state.activeConfig || 'default';
        const config = state.configs.find(c => c.id === activeConfigId);
        
        if (config) {
          const updatedConfig = {
            ...config,
            layouts: config.layouts.filter(w => w.id !== id),
            updated_at: new Date().toISOString(),
          };
          
          set({
            configs: state.configs.map(c => 
              c.id === activeConfigId ? updatedConfig : c
            ),
          });
        }
      },

      updateWidget: (id, updates) => {
        const state = get();
        const activeConfigId = state.activeConfig || 'default';
        const config = state.configs.find(c => c.id === activeConfigId);
        
        if (config) {
          const updatedConfig = {
            ...config,
            layouts: config.layouts.map(w => 
              w.id === id ? { ...w, ...updates } : w
            ),
            updated_at: new Date().toISOString(),
          };
          
          set({
            configs: state.configs.map(c => 
              c.id === activeConfigId ? updatedConfig : c
            ),
          });
        }
      },

      updateLayout: (layouts) => {
        const state = get();
        const activeConfigId = state.activeConfig || 'default';
        const config = state.configs.find(c => c.id === activeConfigId);
        
        if (config) {
          const updatedConfig = {
            ...config,
            layouts,
            updated_at: new Date().toISOString(),
          };
          
          set({
            configs: state.configs.map(c => 
              c.id === activeConfigId ? updatedConfig : c
            ),
          });
        }
      },

      addConfig: (config) => {
        set(state => ({
          configs: [...state.configs, config],
        }));
      },

      setActiveConfig: (id) => {
        set({ activeConfig: id });
      },

      setEditMode: (enabled) => {
        set({ isEditMode: enabled });
      },

      saveConfig: async () => {
        // TODO: Save to API
        // For now, persist middleware handles localStorage
        const state = get();
        console.log('Saving config:', state.configs);
      },

      loadConfig: async () => {
        // TODO: Load from API
        // For now, persist middleware handles localStorage
        const state = get();
        if (state.configs.length === 0) {
          set({ configs: [defaultConfig], activeConfig: 'default' });
        }
      },
    }),
    {
      name: 'management-dashboard-storage',
    }
  )
);
