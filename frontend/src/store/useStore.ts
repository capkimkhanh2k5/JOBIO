import { create } from 'zustand';

interface FilterState {
  search: string;
  category: string;
  province: string;
  job_type: string[];
  level: string[];
  salaryRange: [number, number];
  experienceRange: [number, number];
  isRemote: boolean | null;
  skills: string[];

  setSearch: (search: string) => void;
  setCategory: (category: string) => void;
  setProvince: (province: string) => void;
  setJobType: (type: string[]) => void;
  setLevel: (level: string[]) => void;
  setSalaryRange: (range: [number, number]) => void;
  setExperienceRange: (range: [number, number]) => void;
  setIsRemote: (isRemote: boolean | null) => void;
  setSkills: (skills: string[]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: '',
  category: 'all',
  province: 'all',
  job_type: [],
  level: [],
  salaryRange: [0, 10000],
  experienceRange: [0, 15],
  isRemote: null,
  skills: [],

  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setProvince: (province) => set({ province }),
  setJobType: (job_type) => set({ job_type }),
  setLevel: (level) => set({ level }),
  setSalaryRange: (salaryRange) => set({ salaryRange }),
  setExperienceRange: (experienceRange) => set({ experienceRange }),
  setIsRemote: (isRemote) => set({ isRemote }),
  setSkills: (skills) => set({ skills }),
  resetFilters: () => set({
    search: '',
    category: 'all',
    province: 'all',
    job_type: [],
    level: [],
    salaryRange: [0, 10000],
    experienceRange: [0, 15],
    isRemote: null,
    skills: []
  })
}));
