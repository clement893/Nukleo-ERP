import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: () => boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      error: null,

      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },

      login: (user: User, token: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ user, token, error: null });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, token: null, error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ token });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

