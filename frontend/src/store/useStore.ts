import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface UIState {
  theme: 'light' | 'dark';
  commandOpen: boolean;
  savedJobs: string[];
  toggleTheme: () => void;
  setCommandOpen: (open: boolean) => void;
  toggleSaveJob: (jobId: string) => void;
  isSaved: (jobId: string) => boolean;
}

interface UserState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    skills: string[];
  } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
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

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      commandOpen: false,
      savedJobs: [],
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleSaveJob: (jobId) => set((state) => ({
        savedJobs: state.savedJobs.includes(jobId)
          ? state.savedJobs.filter(id => id !== jobId)
          : [...state.savedJobs, jobId]
      })),
      isSaved: (jobId) => get().savedJobs.includes(jobId)
    }),
    {
      name: 'aurora-hire-ui'
    }
  )
);

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email, password) => {
        // Mock login
        set({
          isAuthenticated: true,
          user: {
            name: 'John Doe',
            email,
            skills: ['React', 'TypeScript', 'Node.js', 'TailwindCSS']
          }
        });
      },
      logout: () => set({ isAuthenticated: false, user: null })
    }),
    {
      name: 'aurora-hire-user'
    }
  )
);
