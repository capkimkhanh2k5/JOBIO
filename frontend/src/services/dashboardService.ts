import api from './api';
import type {
  AdminStats,
  CompanyStats,
  PaginatedResponse,
  BlogPost,
  BlogCategory,
  BlogTag,
  AssessmentTest,
  TestResult,
  MatchingScore,
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

  // ─── Assessment & Tests ───────────────────────────────────────────────

  listTests(params?: { test_type?: string; difficulty_level?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<AssessmentTest>>('/api/assessment-tests/', { params });
  },

  getTest(id: number) {
    return api.get<AssessmentTest>(`/api/assessment-tests/${id}/`);
  },

  startTest(testId: number) {
    return api.post(`/api/assessment-tests/${testId}/start/`);
  },

  submitTest(testId: number, answers: Record<string, unknown>) {
    return api.post<TestResult>(`/api/assessment-tests/${testId}/submit/`, { answers });
  },

  listTestResults(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<TestResult>>('/api/test-results/', { params });
  },

  getTestResult(id: number) {
    return api.get<TestResult>(`/api/test-results/${id}/`);
  },

  // ─── AI Matching ──────────────────────────────────────────────────────

  listMatchingScores(params?: { job_id?: number; recruiter_id?: number; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<MatchingScore>>('/api/matching-scores/', { params });
  },

  calculateMatch(jobId: number, recruiterId: number) {
    return api.post<MatchingScore>('/api/matching-scores/calculate/', { job_id: jobId, recruiter_id: recruiterId });
  },

  // ─── Reviews (write) ─────────────────────────────────────────────────

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
};
