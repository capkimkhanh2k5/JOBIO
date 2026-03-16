import { create } from 'zustand';

export interface CVSearchFilters {
    q: string;
    location: string;
    skills: string[];
    experience_min: number;
    search_status: 'all' | 'active' | 'passive';
    salary_max: number;
}

const initialCVSearchFilters: CVSearchFilters = {
    q: '',
    location: 'all',
    skills: [],
    experience_min: 0,
    search_status: 'all',
    salary_max: 100000000,
};

export interface JobFilters {
    q: string;
    category: string;
    province: string;
    job_type: string[];
    level: string[];
    is_remote: boolean | null;
}

const initialJobFilters: JobFilters = {
    q: '',
    category: 'all',
    province: 'all',
    job_type: [],
    level: [],
    is_remote: null,
};

interface FilterState {
    cvFilters: CVSearchFilters;
    updateCVSearchFilter: (updates: Partial<CVSearchFilters>) => void;
    resetCVSearchFilters: () => void;

    jobFilters: JobFilters;
    updateJobFilter: (updates: Partial<JobFilters>) => void;
    resetJobFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    cvFilters: { ...initialCVSearchFilters },
    updateCVSearchFilter: (updates) => set((state) => ({
        cvFilters: { ...state.cvFilters, ...updates }
    })),
    resetCVSearchFilters: () => set({ cvFilters: { ...initialCVSearchFilters } }),

    jobFilters: { ...initialJobFilters },
    updateJobFilter: (updates) => set((state) => ({
        jobFilters: { ...state.jobFilters, ...updates }
    })),
    resetJobFilters: () => set({ jobFilters: { ...initialJobFilters } }),
}));
