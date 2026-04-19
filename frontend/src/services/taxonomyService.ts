import api from './api';
import type {
  PaginatedResponse,
  Province,
  Commune,
  Industry,
  JobCategory,
  Skill,
  LanguageRef,
} from '@/types/api';

// ─── Taxonomy & Geography (public, usually cached) ──────────────────────────

export const taxonomyService = {
  // ─── Geography ────────────────────────────────────────────────────────

  async listProvinces(params?: { region?: string; search?: string }) {
    try {
      const response = await api.get<any>('/api/provinces/', { 
        params: { ...params, page_size: 100 } 
      });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listProvinces:', e);
      return [];
    }
  },

  async getProvince(id: number) {
    return api.get<Province>(`/api/provinces/${id}/`);
  },

  async listCommunes(params?: { province_id?: number; search?: string; page?: number; page_size?: number }) {
    try {
      const response = await api.get<any>('/api/communes/', { 
        params: { page_size: 100, ...params } 
      });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listCommunes:', e);
      return [];
    }
  },

  async getCommune(id: number) {
    return api.get<Commune>(`/api/communes/${id}/`);
  },

  // ─── Industries ───────────────────────────────────────────────────────

  async listIndustries(params?: { parent_id?: number; is_active?: boolean }) {
    try {
      const response = await api.get<any>('/api/industries/', { 
        params: { page_size: 100, ...params } 
      });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listIndustries:', e);
      return [];
    }
  },

  async getIndustry(id: number) {
    return api.get<Industry>(`/api/industries/${id}/`);
  },

  // ─── Job Categories ───────────────────────────────────────────────────

  async listJobCategories(params?: { parent_id?: number; is_active?: boolean }) {
    try {
      const response = await api.get<any>('/api/job-categories/', { params });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listJobCategories:', e);
      return [];
    }
  },

  async getJobCategory(id: number) {
    return api.get<JobCategory>(`/api/job-categories/${id}/`);
  },

  // ─── Skills ───────────────────────────────────────────────────────────

  async listSkills(params?: { search?: string; q?: string; category_id?: number; page?: number; page_size?: number }) {
    try {
      const isSearch = !!(params?.search || params?.q);
      const endpoint = isSearch ? '/api/skills/search/' : '/api/skills/';
      const queryParams: any = { page_size: 100, ...params };
      if (params?.search && !params?.q) {
        queryParams.q = params.search;
        delete queryParams.search;
      }
      
      const response = await api.get<any>(endpoint, { params: queryParams });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listSkills:', e);
      return [];
    }
  },

  async getSkill(id: number) {
    return api.get<Skill>(`/api/skills/${id}/`);
  },

  async listPopularSkills() {
    try {
      const response = await api.get<any>('/api/skills/popular/');
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listPopularSkills:', e);
      return [];
    }
  },

  // ─── Languages ────────────────────────────────────────────────────────

  async listLanguages() {
    try {
      const response = await api.get<any>('/api/languages/', {
        params: { page_size: 100 }
      });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (e) {
      console.error('Error listLanguages:', e);
      return [];
    }
  },
};
