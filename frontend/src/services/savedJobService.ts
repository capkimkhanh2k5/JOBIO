import api from './api';
import type { SavedJob, SavedJobUpdateRequest } from '@/types/api';

// ─── Saved Jobs ──────────────────────────────────────────────────────────────


export const savedJobService = {
  list(params?: { folder_name?: string; page?: number; page_size?: number }) {
    return api.get<{ count: number; next: string | null; previous: string | null; results: SavedJob[] }>(
      '/api/saved-jobs/',
      { params },
    );
  },

  save(jobId: number, data?: { folder_name?: string; notes?: string }) {
    return api.post<SavedJob>('/api/saved-jobs/', { job_id: jobId, ...data });
  },

  update(id: number, data: SavedJobUpdateRequest) {
    return api.patch<SavedJob>(`/api/saved-jobs/${id}/`, data);
  },

  unsave(id: number) {
    return api.delete(`/api/saved-jobs/${id}/`);
  },

  /** Unsave by job ID instead of saved-job ID */
  unsaveByJob(jobId: number) {
    return api.delete(`/api/saved-jobs/by-job/${jobId}/`);
  },

  /** Check if a job is saved */
  isSaved(jobId: number) {
    return api.get<{ is_saved: boolean; saved_job_id?: number }>(`/api/saved-jobs/check/${jobId}/`);
  },

  /** List folder names for organisation */
  folders() {
    return api.get<string[]>('/api/saved-jobs/folders/');
  },
};
