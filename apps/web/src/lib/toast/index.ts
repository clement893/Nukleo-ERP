/**
 * Toast Store
 * 
 * Zustand store for managing toast notifications globally.
 * Provides centralized state management for toasts across the application.
 */

import { create } from 'zustand';
import { useMemo } from 'react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  icon?: React.ReactNode;
  title?: string;
}

interface ToastStore {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Zustand store for toast notifications
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastData = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // Auto-dismiss if duration > 0
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

/**
 * Hook for showing toasts
 * Provides convenient methods for different toast types
 */
export function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearToasts = useToastStore((state) => state.clearToasts);
  
  // Use useMemo to stabilize the returned object and prevent unnecessary re-renders
  return useMemo(() => ({
    showToast: addToast,
    success: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'success', ...options });
    },
    error: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'error', ...options });
    },
    warning: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'warning', ...options });
    },
    info: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'info', ...options });
    },
    removeToast,
    clearToasts,
  }), [addToast, removeToast, clearToasts]);
}
