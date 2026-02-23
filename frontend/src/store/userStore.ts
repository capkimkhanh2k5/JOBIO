import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'candidate' | 'company';
    avatar_url?: string;
    two_factor_enabled?: boolean;
}

export interface UserState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken, refreshToken) => set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true
            }),
            clearAuth: () => set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false
            }),
            updateUser: (updatedFields) => set((state) => ({
                user: state.user ? { ...state.user, ...updatedFields } : null
            })),
        }),
        {
            name: 'jobio-user-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
