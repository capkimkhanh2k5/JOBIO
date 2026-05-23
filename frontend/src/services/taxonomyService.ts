import api from './api';
import type {
  Province,
  Commune,
  Industry,
  JobCategory,
  Skill,
  LanguageRef,
} from '@/types/api';

// ─── Taxonomy & Geography (public, usually cached) ──────────────────────────

function asList<T>(data: T[] | { results?: T[] } | null | undefined): T[] {
  return Array.isArray(data) ? data : (data?.results || []);
}

export const taxonomyService = {
  // ─── Geography ────────────────────────────────────────────────────────

  async listProvinces(params?: { region?: string; search?: string }): Promise<Province[]> {
    try {
      const response = await api.get<Province[] | { results?: Province[] }>('/api/provinces/', {
        params: { ...params, page_size: 100 }
      });
      return asList(response?.data);
    } catch (e) {
      console.error('Error listProvinces:', e);
      return [];
    }
  },

  async getProvince(id: number) {
    return api.get<Province>(`/api/provinces/${id}/`);
  },

  async listCommunes(params?: { province_id?: number; search?: string; page?: number; page_size?: number }): Promise<Commune[]> {
    try {
      const response = await api.get<Commune[] | { results?: Commune[] }>('/api/communes/', {
        params: { page_size: 100, ...params }
      });
      return asList(response?.data);
    } catch (e) {
      console.error('Error listCommunes:', e);
      return [];
    }
  },

  async getCommune(id: number) {
    return api.get<Commune>(`/api/communes/${id}/`);
  },

  // ─── Industries ───────────────────────────────────────────────────────

  async listIndustries(params?: { parent_id?: number; is_active?: boolean }): Promise<Industry[]> {
    try {
      const response = await api.get<Industry[] | { results?: Industry[] }>('/api/industries/', {
        params: { page_size: 100, ...params }
      });
      return asList(response?.data);
    } catch (e) {
      console.error('Error listIndustries:', e);
      return [];
    }
  },

  async getIndustry(id: number) {
    return api.get<Industry>(`/api/industries/${id}/`);
  },

  // ─── Job Categories ───────────────────────────────────────────────────

  async listJobCategories(params?: { parent_id?: number; is_active?: boolean }): Promise<JobCategory[]> {
    try {
      const response = await api.get<JobCategory[] | { results?: JobCategory[] }>('/api/job-categories/', { params });
      return asList(response?.data);
    } catch (e) {
      console.error('Error listJobCategories:', e);
      return [];
    }
  },

  async getJobCategory(id: number) {
    return api.get<JobCategory>(`/api/job-categories/${id}/`);
  },

  // ─── Skills ───────────────────────────────────────────────────────────

  async listSkills(params?: { search?: string; q?: string; category_id?: number; page?: number; page_size?: number }): Promise<Skill[]> {
    try {
      const isSearch = !!(params?.search || params?.q);
      const endpoint = isSearch ? '/api/skills/search/' : '/api/skills/';
      const queryParams: any = { page_size: 100, ...params };
      if (params?.search && !params?.q) {
        queryParams.q = params.search;
        delete queryParams.search;
      }

      const response = await api.get<Skill[] | { results?: Skill[] }>(endpoint, { params: queryParams });
      return asList(response?.data);
    } catch (e) {
      console.error('Error listSkills:', e);
      return [];
    }
  },

  async getSkill(id: number) {
    return api.get<Skill>(`/api/skills/${id}/`);
  },

  async listPopularSkills(): Promise<Skill[]> {
    try {
      const response = await api.get<Skill[] | { results?: Skill[] }>('/api/skills/popular/');
      return asList(response?.data);
    } catch (e) {
      console.error('Error listPopularSkills:', e);
      return [];
    }
  },

  // ─── Languages ────────────────────────────────────────────────────────

  async listLanguages(): Promise<LanguageRef[]> {
    try {
      const response = await api.get<LanguageRef[] | { results?: LanguageRef[] }>('/api/languages/', {
        params: { page_size: 100 }
      });
      return asList(response?.data);
    } catch (e) {
      console.error('Error listLanguages:', e);
      return [];
    }
  },
};
