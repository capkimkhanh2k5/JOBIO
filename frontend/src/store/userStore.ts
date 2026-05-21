import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/api';
import { authStorage, AUTH_STORAGE_KEY } from '@/lib/authStorage';

// Re-export User type for backward compatibility
export type { User };

export interface UserState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    rememberMe: boolean;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            rememberMe: false,
            isAuthenticated: false,
            setAuth: (user, accessToken, refreshToken, rememberMe = true) => set({
                user,
                accessToken,
                refreshToken,
                rememberMe,
                isAuthenticated: true
            }),
            clearAuth: () => set({
                user: null,
                accessToken: null,
                refreshToken: null,
                rememberMe: false,
                isAuthenticated: false
            }),
            updateUser: (updatedFields) => set((state) => ({
                user: state.user ? { ...state.user, ...updatedFields } : null
            })),
        }),
        {
            name: AUTH_STORAGE_KEY,
            storage: createJSONStorage(() => authStorage),
            merge: (persistedState, currentState) => {
                const hydrated = persistedState as Partial<UserState> | undefined;

                return {
                    ...currentState,
                    ...hydrated,
                    rememberMe: hydrated?.rememberMe ?? true,
                };
            },
        }
    )
);
