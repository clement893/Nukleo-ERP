'use client';

/**
 * Dashboard Context Provider
 * Fournit le contexte du dashboard à tous les composants enfants
 */

import { createContext, useContext, ReactNode } from 'react';
import type { DashboardContext } from '@/lib/dashboard/store';

interface DashboardContextValue {
  context: DashboardContext;
}

const DashboardContextProvider = createContext<DashboardContextValue | undefined>(undefined);

interface DashboardContextProviderProps {
  children: ReactNode;
  context: DashboardContext;
}

export function DashboardContextProviderComponent({ children, context }: DashboardContextProviderProps) {
  return (
    <DashboardContextProvider.Provider value={{ context }}>
      {children}
    </DashboardContextProvider.Provider>
  );
}

export function useDashboardContext(): DashboardContext {
  const context = useContext(DashboardContextProvider);
  if (!context) {
    // Par défaut, utiliser 'main' si le contexte n'est pas fourni
    return 'main';
  }
  return context.context;
}
