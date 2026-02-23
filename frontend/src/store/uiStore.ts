import { create } from 'zustand';

interface UiState {
    isCommandOpen: boolean;
    setCommandOpen: (open: boolean) => void;
    toggleCommand: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>((set) => ({
    isCommandOpen: false,
    setCommandOpen: (open) => set({ isCommandOpen: open }),
    toggleCommand: () => set((state) => ({ isCommandOpen: !state.isCommandOpen })),
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
    },
}));
