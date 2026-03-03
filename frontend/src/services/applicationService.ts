import api from './api';
import type {
  PaginatedResponse,
  ApplicationListItem,
  ApplicationDetail,
  ApplicationCreateRequest,
  ApplicationUpdateRequest,
  ApplicationFilters,
  ApplicationStatusHistoryItem,
} from '@/types/api';

// ─── Applications ────────────────────────────────────────────────────────────

export const applicationService = {
  // ─── Top-level (all applications visible to the user) ─────────────────

  list(params?: ApplicationFilters) {
    return api.get<PaginatedResponse<ApplicationListItem>>('/api/applications/', { params });
  },

  getById(id: number) {
    return api.get<ApplicationDetail>(`/api/applications/${id}/`);
  },

  create(data: ApplicationCreateRequest) {
    return api.post<ApplicationDetail>('/api/applications/', data);
  },

  update(id: number, data: ApplicationUpdateRequest) {
    return api.patch<ApplicationDetail>(`/api/applications/${id}/`, data);
  },

  delete(id: number) {
    return api.delete(`/api/applications/${id}/`);
  },

  // ─── Nested under Job ─────────────────────────────────────────────────

  listByJob(jobId: number, params?: ApplicationFilters) {
    return api.get<PaginatedResponse<ApplicationListItem>>(`/api/jobs/${jobId}/applications/`, { params });
  },

  // ─── Status management ────────────────────────────────────────────────

  updateStatus(id: number, status: string, notes?: string) {
    return api.post(`/api/applications/${id}/update-status/`, { status, notes });
  },

  getStatusHistory(applicationId: number) {
    return api.get<ApplicationStatusHistoryItem[]>(
      `/api/applications/${applicationId}/status-history/`,
    );
  },

  // ─── Bulk actions ─────────────────────────────────────────────────────

  bulkUpdateStatus(ids: number[], status: string) {
    return api.post('/api/applications/bulk-update-status/', { ids, status });
  },

  // ─── Actions ──────────────────────────────────────────────────────────

  withdraw(id: number) {
    return api.post(`/api/applications/${id}/withdraw/`);
  },

  rate(id: number, rating: number) {
    return api.post(`/api/applications/${id}/rate/`, { rating });
  },
};
