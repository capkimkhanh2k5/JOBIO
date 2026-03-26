import api from './api';
import type {
  AdminStats,
  CompanyStats,
  PaginatedResponse,
  BlogPost,
  BlogCategory,
  BlogTag,
  Review,
  FileUpload,
} from '@/types/api';

// ─── Dashboard & Analytics ───────────────────────────────────────────────────

export const dashboardService = {
  // ─── Stats endpoints ──────────────────────────────────────────────────

  getAdminStats() {
    return api.get<AdminStats>('/api/dashboard/stats/admin/');
  },

  getCompanyStats() {
    return api.get<CompanyStats>('/api/dashboard/stats/company/');
  },

  // ─── Analytics Reports ────────────────────────────────────────────────

  getAnalyticsReports(params?: { report_type?: string; date_from?: string; date_to?: string }) {
    return api.get('/api/analytics-reports/', { params });
  },

  // ─── Blog ─────────────────────────────────────────────────────────────

  listPosts(params?: { category_id?: number; tag_id?: number; status?: string; search?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<BlogPost>>('/api/blog/posts/', { params });
  },

  getPost(slug: string) {
    return api.get<BlogPost>(`/api/blog/posts/${slug}/`);
  },

  listBlogCategories() {
    return api.get<BlogCategory[]>('/api/blog/categories/');
  },

  listBlogTags() {
    return api.get<BlogTag[]>('/api/blog/tags/');
  },

  // ─── Reviews (write) ─────────────────────────────────────────────────

  /** Admin: list reviews pending moderation */
  listPendingReviews(params?: { page?: number; page_size?: number }) {
    return api.get<{ reviews: Review[]; total: number }>('/api/reviews/pending/', { params });
  },

  /** Admin: approve or reject a review */
  moderateReview(id: number, action: 'approve' | 'reject', reason?: string) {
    return api.patch(`/api/reviews/${id}/approve/`, { action, reason });
  },

  createReview(data: {
    company_id: number;
    rating: number;
    title: string;
    content: string;
    pros?: string;
    cons?: string;
    work_environment_rating?: number;
    salary_benefits_rating?: number;
    management_rating?: number;
    career_development_rating?: number;
    employment_status?: string;
    position?: string;
    is_anonymous?: boolean;
  }) {
    return api.post<Review>('/api/reviews/', data);
  },

  // ─── Users (Admin) ─────────────────────────────────────────────────────────

  listUsers(params?: { role?: string; status?: string; search?: string; page?: number; page_size?: number }) {
    return api.get('/api/users/', { params });
  },

  getUserStats() {
    return api.get('/api/users/stats/');
  },

  updateUserStatus(userId: number, status: string) {
    return api.patch(`/api/users/${userId}/status/`, { status });
  },

  bulkUserAction(action: string, userIds: number[]) {
    return api.post('/api/users/bulk-action/', { action, user_ids: userIds });
  },

  // ─── System Settings ──────────────────────────────────────────────────

  listSystemSettings() {
    return api.get('/api/system-settings/');
  },

  updateSystemSetting(id: number, data: { setting_value?: string; is_public?: boolean; description?: string }) {
    return api.patch(`/api/system-settings/${id}/`, data);
  },

  // ─── Activity Logs ────────────────────────────────────────────────────

  listActivityLogs(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get('/api/activity-logs/', { params });
  },

  // ─── File Uploads (Admin) ─────────────────────────────────────────────

  listFileUploads(params?: { page?: number; page_size?: number }) {
    return api.get('/api/file-uploads/', { params });
  },

  deleteFileUpload(id: number) {
    return api.delete(`/api/file-uploads/${id}/`);
  },

  // ─── Email Templates & Logs ────────────────────────────────────────────────

  listEmailTemplates(params?: { category?: string; page?: number; page_size?: number }) {
    return api.get('/api/email/templates/', { params });
  },

  listEmailCategories() {
    return api.get('/api/email/template-categories/');
  },

  listSentEmails(params?: { status?: string; page?: number; page_size?: number }) {
    return api.get('/api/email/logs/', { params });
  },

  // ─── File Upload ──────────────────────────────────────────────────────

  uploadFile(file: File, entityType?: string, entityId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    if (entityType) formData.append('entity_type', entityType);
    if (entityId) formData.append('entity_id', String(entityId));
    return api.post<FileUpload>('/api/file-uploads/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ─── Search History ───────────────────────────────────────────────────

  listSearchHistory(params?: { page?: number; page_size?: number }) {
    return api.get('/api/search-history/', { params });
  },

  clearSearchHistory() {
    return api.delete('/api/search-history/clear/');
  },

  deleteSearchHistoryItem(id: number) {
    return api.delete(`/api/search-history/${id}/`);
  },
};
