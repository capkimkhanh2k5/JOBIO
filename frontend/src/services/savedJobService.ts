import api from './api';
import type { SavedJob, SavedJobUpdateRequest } from '@/types/api';

// ─── Saved Jobs ──────────────────────────────────────────────────────────────
// NOTE: Backend có 2 ViewSets:
//   1) RecruiterSavedJobViewSet (nested): GET /api/recruiters/:id/saved-jobs/ — chỉ list
//   2) SavedJobViewSet (flat): PATCH /api/saved-jobs/:id/ — chỉ partial_update
// Các method save/unsave/unsaveByJob/isSaved/folders chưa có backend endpoint.

export const savedJobService = {
  list(params?: { folder_name?: string; page?: number; page_size?: number }) {
    return api.get<{ count: number; next: string | null; previous: string | null; results: SavedJob[] }>(
      '/api/saved-jobs/',
      { params },
    );
  },

  // TODO: Backend chưa có POST /api/saved-jobs/ — cần thêm create action
  save(jobId: number, data?: { folder_name?: string; notes?: string }) {
    return api.post<SavedJob>('/api/saved-jobs/', { job_id: jobId, ...data });
  },

  update(id: number, data: SavedJobUpdateRequest) {
    return api.patch<SavedJob>(`/api/saved-jobs/${id}/`, data);
  },

  // TODO: Backend chưa có DELETE /api/saved-jobs/:id/ — cần thêm destroy action
  unsave(id: number) {
    return api.delete(`/api/saved-jobs/${id}/`);
  },

  /** Unsave by job ID instead of saved-job ID */
  // TODO: Backend chưa có endpoint by-job — cần thêm custom action
  unsaveByJob(jobId: number) {
    return api.delete(`/api/saved-jobs/by-job/${jobId}/`);
  },

  /** Check if a job is saved */
  // TODO: Backend chưa có endpoint check — cần thêm custom action
  isSaved(jobId: number) {
    return api.get<{ is_saved: boolean; saved_job_id?: number }>(`/api/saved-jobs/check/${jobId}/`);
  },

  /** List folder names for organisation */
  // TODO: Backend chưa có endpoint folders — cần thêm custom action
  folders() {
    return api.get<string[]>('/api/saved-jobs/folders/');
  },
};
