'use client';

import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  endpoint: string | null;
  setAuthenticated: (authenticated: boolean) => void;
  setEndpoint: (endpoint: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  endpoint: null,
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setEndpoint: (endpoint) => set({ endpoint }),
  logout: () => set({ isAuthenticated: false, endpoint: null }),
}));
