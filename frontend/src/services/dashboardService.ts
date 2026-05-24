import api from './api';
import type {
  AdminOverviewStats,
  UserGrowthData,
  IndustryDistributionData,
  RevenueTrendData,
  ViolationBreakdownData,
  TopJobAnalytics,
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
    return api.get<AdminOverviewStats>('/api/dashboard/stats/admin/');
  },

  getCompanyStats() {
    return api.get<CompanyStats>('/api/dashboard/stats/company/');
  },

  getModerationStats() {
    return api.get('/api/companies/moderation-stats/');
  },

  // ─── Admin Analytics (real data endpoints) ────────────────────────────

  /** GET /api/analytics/overview/ — Tổng quan đầy đủ cho Dashboard */
  getAnalyticsOverview() {
    return api.get<AdminOverviewStats>('/api/analytics/overview/');
  },

  /** GET /api/analytics/user-growth/?months=7 */
  getUserGrowth(months = 7) {
    return api.get<UserGrowthData[]>(
      '/api/analytics/user-growth/',
      { params: { months } }
    );
  },

  /** GET /api/analytics/industry-distribution/ */
  getIndustryDistribution() {
    return api.get<IndustryDistributionData[]>(
      '/api/analytics/industry-distribution/'
    );
  },

  /** GET /api/analytics/revenue-trend/?days=7 */
  getRevenueTrend(days = 7) {
    return api.get<RevenueTrendData[]>(
      '/api/analytics/revenue-trend/',
      { params: { days } }
    );
  },

  /** GET /api/analytics/application-stats/ */
  getApplicationStats() {
    return api.get('/api/analytics/application-stats/');
  },

  /** GET /api/analytics/top-jobs/?limit=10 */
  getTopJobs(limit = 10) {
    return api.get<TopJobAnalytics[]>('/api/analytics/top-jobs/', { params: { limit } });
  },

  /** GET /api/analytics/violation-breakdown/ */
  getViolationBreakdown() {
    return api.get<ViolationBreakdownData[]>(
      '/api/analytics/violation-breakdown/'
    );
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

  updateUser(userId: number, data: { full_name?: string; phone?: string | null }) {
    return api.patch(`/api/users/${userId}/`, data);
  },

  updateUserRole(userId: number, role: string) {
    return api.patch(`/api/users/${userId}/role/`, { role });
  },

  updateUserEmailVerified(userId: number, email_verified: boolean) {
    return api.patch(`/api/users/${userId}/verify-email/`, { email_verified });
  },


  bulkUserAction(action: string, userIds: number[]) {
    return api.post('/api/users/bulk-action/', { action, ids: userIds });
  },

  exportUsers(params?: { role?: string; status?: string; search?: string }) {
    return api.get('/api/users/export/', { params, responseType: 'blob' });
  },

  // ─── System Settings ──────────────────────────────────────────────────

  listSystemSettings() {
    return api.get('/api/system/settings/');
  },

  updateSystemSetting(id: number, data: { setting_value?: string; is_public?: boolean; description?: string }) {
    return api.patch(`/api/system/settings/${id}/`, data);
  },

  // ─── Activity Logs ────────────────────────────────────────────────────

  listActivityLogs(params?: { search?: string; log_type?: string; date_from?: string; date_to?: string; page?: number; page_size?: number }) {
    return api.get('/api/activity-logs/', { params });
  },

  getActivityLogsStats() {
    return api.get('/api/activity-logs/stats/');
  },

  // ─── File Uploads (Admin) ─────────────────────────────────────────────

  listFileUploads(params?: { search?: string; file_type?: string; entity_type?: string; date_from?: string; date_to?: string; page?: number; page_size?: number }) {
    return api.get('/api/file-uploads/', { params });
  },

  getFileUploadsStats() {
    return api.get('/api/file-uploads/stats/');
  },

  deleteFileUpload(id: number) {
    return api.delete(`/api/file-uploads/${id}/`);
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

  listAdminSubscriptions(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get('/api/billing/admin-finance/subscriptions/', { params });
  },

  listAdminSubscriptionPlans(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get('/api/billing/admin-subscription-plans/', { params });
  },

  updateAdminSubscriptionPlan(id: number, data: { price?: number | string; duration_days?: number; is_active?: boolean }) {
    return api.patch(`/api/billing/admin-subscription-plans/${id}/`, data);
  },

  exportTransactions(params?: { status?: string; search?: string }) {
    return api.get('/api/billing/admin-finance/export/', { params, responseType: 'blob' });
  },

  exportAdminJobs(params?: { status?: string; search?: string }) {
    return api.get('/api/jobs/admin-jobs/export/', { params, responseType: 'blob' });
  },

  // ─── Job Marketplace (Admin) ──────────────────────────────────────────────

  getJobStats() {
    return api.get('/api/jobs/admin-jobs/stats/');
  },

  listAdminJobs(params?: { page?: number; page_size?: number; search?: string; status?: string }) {
    return api.get('/api/jobs/admin-jobs/', { params });
  },

  listAdminReports(params?: { status?: string; search?: string; page?: number; page_size?: number }) {
    return api.get('/api/system/reports/admin-reports/', { params });
  },

  getReportStats() {
    return api.get('/api/system/reports/admin-reports/stats/');
  },

  updateReportStatus(id: number, data: { status: string; resolution_notes?: string }) {
    return api.patch(`/api/system/reports/admin-reports/${id}/update_status/`, data);
  },

  resolveReport(id: number, data: { action: 'ban' | 'hide_content' | 'warn' | 'reject'; reporter_note?: string; violator_note?: string }) {
    return api.post(`/api/system/reports/admin-reports/${id}/resolve/`, data);
  },

  exportAdminReports(params?: { status?: string; search?: string }) {
    return api.get('/api/system/reports/admin-reports/export/', { params, responseType: 'blob' });
  },

  // ─── Master Data (Admin CRUD) ──────────────────────────────────────────────

  listSkillCategories() { return api.get('/api/skills/categories/'); },
  listSkills(params?: { category?: number; search?: string; page?: number; page_size?: number }) {
    return api.get('/api/skills/', { params });
  },
  createSkill(data: { name: string; slug: string; category: number; description?: string }) {
    return api.post('/api/skills/', data);
  },
  updateSkill(id: number, data: Partial<{ name: string; slug: string; description: string; is_active: boolean; category: number }>) {
    return api.patch(`/api/skills/${id}/`, data);
  },
  deleteSkill(id: number) { return api.delete(`/api/skills/${id}/`); },

  listIndustries(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get('/api/industries/', { params });
  },
  createIndustry(data: { name: string; slug: string; description?: string; icon_url?: string }) {
    return api.post('/api/industries/', data);
  },
  updateIndustry(id: number, data: Partial<{ name: string; slug: string; description: string; icon_url: string }>) {
    return api.patch(`/api/industries/${id}/`, data);
  },
  deleteIndustry(id: number) { return api.delete(`/api/industries/${id}/`); },

  listJobCategories(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get('/api/job-categories/', { params });
  },
  createJobCategory(data: { name: string; slug: string; parent?: number; icon_url?: string; description?: string }) {
    return api.post('/api/job-categories/', data);
  },
  updateJobCategory(id: number, data: Partial<{ name: string; slug: string; parent: number; icon_url: string }>) {
    return api.patch(`/api/job-categories/${id}/`, data);
  },
  deleteJobCategory(id: number) { return api.delete(`/api/job-categories/${id}/`); },

  listBenefitCategories(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get('/api/benefit-categories/', { params });
  },
  createBenefitCategory(data: { name: string; slug: string; icon_url?: string; description?: string }) {
    return api.post('/api/benefit-categories/', data);
  },
  updateBenefitCategory(id: number, data: Partial<{ name: string; slug: string; icon_url: string; description: string }>) {
    return api.patch(`/api/benefit-categories/${id}/`, data);
  },
  deleteBenefitCategory(id: number) { return api.delete(`/api/benefit-categories/${id}/`); },

  // ─── Notifications (Admin Broadcast) ──────────────────────────────────────

  broadcastNotification(data: { title: string; message: string; target: 'all' | 'candidate' | 'company'; notification_type_id?: number }) {
    return api.post('/api/notifications/broadcast/', data);
  },

  listNotificationTypes() {
    return api.get('/api/notification-types/');
  },
  /** GET /api/analytics/overview/ — dùng để lấy badge counts cho sidebar */
  getSidebarBadges() {
    return api.get<{
      reports: { pending: number };
      companies: { pending_verification: number };
    }>('/api/analytics/overview/');
  },
};
