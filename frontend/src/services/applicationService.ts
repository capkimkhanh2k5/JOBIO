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

  previewCv(id: number) {
    return api.get<{ html_content: string; template_id: number }>(`/api/applications/${id}/cv_preview/`);
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
    return api.patch(`/api/applications/${id}/status/`, { status, notes });
  },

  getStatusHistory(applicationId: number) {
    return api.get<ApplicationStatusHistoryItem[]>(
      `/api/applications/${applicationId}/history/`,
    );
  },

  // ─── Bulk actions ─────────────────────────────────────────────────────

  bulkUpdateStatus(ids: number[], status: string) {
    const action =
      status === 'shortlisted' ? 'shortlist' :
      status === 'rejected' ? 'reject' :
      status;
    return api.post('/api/applications/bulk-action/', {
      application_ids: ids,
      action,
    });
  },

  // ─── Actions ──────────────────────────────────────────────────────────

  withdraw(id: number) {
    return api.post(`/api/applications/${id}/withdraw/`);
  },

  rate(id: number, rating: number) {
    return api.patch(`/api/applications/${id}/rating/`, { rating });
  },
};
