import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenStorage } from './auth/tokenStorage';

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
  refreshToken: string | null;
  isAuthenticated: () => boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      error: null,

      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },

      login: (user: User, token: string, refreshToken?: string) => {
        TokenStorage.setToken(token);
        if (refreshToken) {
          TokenStorage.setRefreshToken(refreshToken);
        }
        set({ user, token, refreshToken: refreshToken || null, error: null });
      },

      logout: () => {
        TokenStorage.removeTokens();
        set({ user: null, token: null, refreshToken: null, error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        TokenStorage.setToken(token);
        set({ token });
      },

      setRefreshToken: (refreshToken: string) => {
        TokenStorage.setRefreshToken(refreshToken);
        set({ refreshToken });
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
        refreshToken: state.refreshToken,
      }),
    }
  )
);

