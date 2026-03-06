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

  listProvinces(params?: { region?: string; search?: string }) {
    return api.get<PaginatedResponse<Province>>('/api/provinces/', { params });
  },

  getProvince(id: number) {
    return api.get<Province>(`/api/provinces/${id}/`);
  },

  listCommunes(params?: { province_id?: number; search?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Commune>>('/api/communes/', { params });
  },

  getCommune(id: number) {
    return api.get<Commune>(`/api/communes/${id}/`);
  },

  // ─── Industries ───────────────────────────────────────────────────────

  listIndustries(params?: { parent_id?: number; is_active?: boolean }) {
    return api.get<PaginatedResponse<Industry>>('/api/industries/', { params });
  },

  getIndustry(id: number) {
    return api.get<Industry>(`/api/industries/${id}/`);
  },

  // ─── Job Categories ───────────────────────────────────────────────────

  listJobCategories(params?: { parent_id?: number; is_active?: boolean }) {
    return api.get<PaginatedResponse<JobCategory>>('/api/job-categories/', { params });
  },

  getJobCategory(id: number) {
    return api.get<JobCategory>(`/api/job-categories/${id}/`);
  },

  // ─── Skills ───────────────────────────────────────────────────────────

  listSkills(params?: { search?: string; category_id?: number; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Skill>>('/api/skills/', { params });
  },

  getSkill(id: number) {
    return api.get<Skill>(`/api/skills/${id}/`);
  },

  // ─── Languages ────────────────────────────────────────────────────────

  listLanguages() {
    return api.get<LanguageRef[]>('/api/languages/');
  },
};
