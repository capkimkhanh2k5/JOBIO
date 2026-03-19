import api from './api';
import type {
  PaginatedResponse,
  JobListItem,
  JobDetail,
  JobCreateRequest,
  JobUpdateRequest,
  JobFilters,
  JobSkill,
  JobLocation,
} from '@/types/api';

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobService = {
  // ─── CRUD ──────────────────────────────────────────────────────────────

  list(params?: JobFilters) {
    return api.get<PaginatedResponse<JobListItem>>('/api/jobs/', { params });
  },

  getById(id: number) {
    return api.get<JobDetail>(`/api/jobs/${id}/`);
  },

  getBySlug(slug: string) {
    return api.get<JobDetail>(`/api/jobs/slug/${slug}/`);
  },

  create(data: JobCreateRequest) {
    return api.post<JobDetail>('/api/jobs/', data);
  },

  update(id: number, data: JobUpdateRequest) {
    return api.patch<JobDetail>(`/api/jobs/${id}/`, data);
  },

  delete(id: number) {
    return api.delete(`/api/jobs/${id}/`);
  },

  // ─── Actions ─────────────────────────────────────────────────────────────

  publish(id: number) {
    return api.post<JobDetail>(`/api/jobs/${id}/publish/`);
  },

  close(id: number) {
    return api.post<JobDetail>(`/api/jobs/${id}/close/`);
  },

  duplicate(id: number) {
    return api.post<JobDetail>(`/api/jobs/${id}/duplicate/`);
  },

  /** Featured jobs for homepage */
  featured(params?: { page_size?: number }) {
    return api.get<JobListItem[]>('/api/jobs/featured/', { params });
  },

  /** Similar/related jobs */
  similar(id: number) {
    return api.get<JobListItem[]>(`/api/jobs/${id}/similar/`);
  },

  /** AI Recommended jobs for candidate */
  recommendations(params?: { page_size?: number }) {
    return api.get<JobListItem[]>('/api/jobs/recommendations/', { params });
  },

  // ─── Nested: Job Skills ───────────────────────────────────────────────

  listSkills(jobId: number) {
    return api.get<JobSkill[]>(`/api/jobs/${jobId}/skills/`);
  },

  addSkill(jobId: number, data: { skill_id: number; is_required?: boolean; proficiency_level?: string }) {
    return api.post<JobSkill>(`/api/jobs/${jobId}/skills/`, data);
  },

  removeSkill(jobId: number, skillId: number) {
    return api.delete(`/api/jobs/${jobId}/skills/${skillId}/`);
  },

  // ─── Nested: Job Locations ────────────────────────────────────────────

  listLocations(jobId: number) {
    return api.get<JobLocation[]>(`/api/jobs/${jobId}/locations/`);
  },

  addLocation(jobId: number, data: { address_id: number; is_primary?: boolean }) {
    return api.post<JobLocation>(`/api/jobs/${jobId}/locations/`, data);
  },

  removeLocation(jobId: number, locationId: number) {
    return api.delete(`/api/jobs/${jobId}/locations/${locationId}/`);
  },
};
