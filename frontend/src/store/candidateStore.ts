import { create } from 'zustand';

export type ViewMode = 'kanban' | 'table';

export interface CandidatesFilters {
    jobId: string | null;
    statuses: string[];
    aiScoreRange: [number, number];
    dateRange: { from: Date | undefined; to: Date | undefined };
    searchQuery: string;
    skills: string[];
}

interface CandidateStore {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    filters: CandidatesFilters;
    setFilters: (filters: Partial<CandidatesFilters>) => void;
    clearFilters: () => void;
    selectedCandidateId: string | null;
    setSelectedCandidateId: (id: string | null) => void;
    selectedJobId: string | null;
    setSelectedJobId: (id: string | null) => void;
    // For Kanban tracking
    draggedCandidateId: string | null;
    setDraggedCandidateId: (id: string | null) => void;
    // For Table bulk actions
    selectedCandidatesForBulk: string[];
    toggleCandidateForBulk: (id: string) => void;
    clearBulkSelection: () => void;
    selectAllForBulk: (ids: string[]) => void;
}

const defaultFilters: CandidatesFilters = {
    jobId: null,
    statuses: [],
    aiScoreRange: [0, 100],
    dateRange: { from: undefined, to: undefined },
    searchQuery: '',
    skills: []
};

export const useCandidateStore = create<CandidateStore>((set) => ({
    viewMode: 'kanban',
    setViewMode: (mode) => set({ viewMode: mode }),

    filters: defaultFilters,
    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),
    clearFilters: () => set({ filters: defaultFilters }),

    selectedCandidateId: null,
    setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),

    selectedJobId: null,
    setSelectedJobId: (id) => set({ selectedJobId: id }),

    draggedCandidateId: null,
    setDraggedCandidateId: (id) => set({ draggedCandidateId: id }),

    selectedCandidatesForBulk: [],
    toggleCandidateForBulk: (id) => set((state) => ({
        selectedCandidatesForBulk: state.selectedCandidatesForBulk.includes(id)
            ? state.selectedCandidatesForBulk.filter((c) => c !== id)
            : [...state.selectedCandidatesForBulk, id]
    })),
    clearBulkSelection: () => set({ selectedCandidatesForBulk: [] }),
    selectAllForBulk: (ids) => set({ selectedCandidatesForBulk: ids })
}));
