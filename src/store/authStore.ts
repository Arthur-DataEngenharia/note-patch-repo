import { create } from 'zustand';
import { api } from '@/api/client';
import { useAppStore } from './appStore';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

function syncUserToApp(user: User | null) {
  if (user) {
    useAppStore.getState().setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      avatarUrl: user.avatarUrl,
    });
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
    syncUserToApp(res.user);
  },

  register: async (name, email, password, role) => {
    const res = await api.register(name, email, password, role);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
    syncUserToApp(res.user);
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await api.me();
      set({ user, token, isAuthenticated: true, isLoading: false });
      syncUserToApp(user);
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
