import api from './api';
import type {
  PaginatedResponse,
  JobAlert,
  JobAlertCreateRequest,
  JobAlertUpdateRequest,
  JobAlertMatch,
} from '@/types/api';

// ─── Job Alerts ──────────────────────────────────────────────────────────────

export const alertService = {
  list(params?: { is_active?: boolean; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<JobAlert>>('/api/job-alerts/', { params });
  },

  getById(id: number) {
    return api.get<JobAlert>(`/api/job-alerts/${id}/`);
  },

  create(data: JobAlertCreateRequest) {
    return api.post<JobAlert>('/api/job-alerts/', data);
  },

  update(id: number, data: JobAlertUpdateRequest) {
    return api.patch<JobAlert>(`/api/job-alerts/${id}/`, data);
  },

  delete(id: number) {
    return api.delete(`/api/job-alerts/${id}/`);
  },

  /** Toggle active status */
  toggle(id: number) {
    return api.post<JobAlert>(`/api/job-alerts/${id}/toggle/`);
  },

  /** Get matching jobs for this alert */
  matches(id: number, params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<JobAlertMatch>>(`/api/job-alerts/${id}/matches/`, { params });
  },

  /** Mark a match as viewed */
  markMatchViewed(alertId: number, matchId: number) {
    return api.post(`/api/job-alerts/${alertId}/matches/${matchId}/mark-viewed/`);
  },
};
