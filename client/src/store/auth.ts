import { create } from 'zustand';
import type {MiniAppUser} from '@/interfaces';

interface AuthState {
    token: string | null;
    user: MiniAppUser | null;
    setToken: (token: string) => void;
    clearToken: () => void;
    setUser: (user: MiniAppUser) => void;
    clearUser: () => void;
    setEnergy: (energy: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    setToken: (token: string) => set({ token }),
    clearToken: () => set({ token: null, user: null }),
    setUser: (user: MiniAppUser) => set({ user }),
    clearUser: () => set({ user: null }),
    setEnergy: (energy: number) => set((state) => ({
        user: state.user ? { ...state.user, energy: (state.user.energy || 0) + energy } : null,
    })),
}));