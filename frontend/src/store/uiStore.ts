import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UiState {
    isCommandOpen: boolean;
    setCommandOpen: (open: boolean) => void;
    toggleCommand: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    savedJobs: string[];
    toggleSaveJob: (jobId: string) => void;
    isSaved: (jobId: string) => boolean;
}

export const useUiStore = create<UiState>()(
    persist(
        (set, get) => ({
            isCommandOpen: false,
            setCommandOpen: (open: boolean) => set({ isCommandOpen: open }),
            toggleCommand: () => set((state) => ({ isCommandOpen: !state.isCommandOpen })),
            theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
            setTheme: (theme: 'light' | 'dark') => {
                localStorage.setItem('theme', theme);
                document.documentElement.classList.toggle('dark', theme === 'dark');
                set({ theme });
            },
            savedJobs: [],
            toggleSaveJob: (jobId: string) => set((state) => ({
                savedJobs: state.savedJobs.includes(jobId)
                    ? state.savedJobs.filter(id => id !== jobId)
                    : [...state.savedJobs, jobId]
            })),
            isSaved: (jobId: string) => get().savedJobs.includes(jobId),
        }),
        {
            name: 'jobio-ui-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
