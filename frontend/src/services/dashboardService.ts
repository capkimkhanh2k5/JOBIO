import api from './api';
import type {
  AdminStats,
  CompanyStats,
  PaginatedResponse,
  BlogPost,
  BlogCategory,
  BlogTag,
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

  exportUsers() {
    return api.get('/api/users/export/', { responseType: 'blob' });
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



  // ─── Financial Management (Admin) ──────────────────────────────────────────

  getFinancialStats() {
    return api.get('/api/billing/admin-finance/stats/');
  },

  listAdminTransactions(params?: { status?: string; search?: string; page?: number; page_size?: number }) {
    return api.get('/api/billing/admin-finance/', { params });
  },

  exportTransactions(params?: { status?: string; search?: string }) {
    return api.get('/api/billing/admin-finance/export/', { params, responseType: 'blob' });
  },

  getJobStats() {
    return api.get('/api/jobs/admin-jobs/stats/');
  },

  listAdminJobs(params?: { status?: string; search?: string; page?: number; page_size?: number }) {
    return api.get('/api/jobs/admin-jobs/', { params });
  },

  exportAdminJobs(params?: { status?: string; search?: string }) {
    return api.get('/api/jobs/admin-jobs/export/', { params, responseType: 'blob' });
  },

  getReportStats() {
    return api.get('/api/system/reports/admin-reports/stats/');
  },

  listAdminReports(params?: { status?: string; search?: string; page?: number; page_size?: number }) {
    return api.get('/api/system/reports/admin-reports/', { params });
  },

  updateReportStatus(id: number, data: { status: string; resolution_notes?: string }) {
    return api.patch(`/api/system/reports/admin-reports/${id}/update_status/`, data);
  },

  exportAdminReports(params?: { status?: string; search?: string }) {
    return api.get('/api/system/reports/admin-reports/export/', { params, responseType: 'blob' });
  },
};
