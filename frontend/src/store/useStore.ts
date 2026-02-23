import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  search: string;
  location: string;
  type: string[];
  remote: string[];
  salaryRange: [number, number];
  tags: string[];
  setSearch: (search: string) => void;
  setLocation: (location: string) => void;
  setType: (type: string[]) => void;
  setRemote: (remote: string[]) => void;
  setSalaryRange: (range: [number, number]) => void;
  setTags: (tags: string[]) => void;
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
  location: '',
  type: [],
  remote: [],
  salaryRange: [0, 300000],
  tags: [],
  setSearch: (search) => set({ search }),
  setLocation: (location) => set({ location }),
  setType: (type) => set({ type }),
  setRemote: (remote) => set({ remote }),
  setSalaryRange: (salaryRange) => set({ salaryRange }),
  setTags: (tags) => set({ tags }),
  resetFilters: () => set({
    search: '',
    location: '',
    type: [],
    remote: [],
    salaryRange: [0, 300000],
    tags: []
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
