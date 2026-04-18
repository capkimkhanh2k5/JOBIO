import api from './api';
import type {
  PaginatedResponse,
  CompanyListItem,
  CompanyDetail,
  CompanyCreateRequest,
  CompanyUpdateRequest,
  CompanyBenefit,
  CompanyMedia,
  BenefitCategory,
  MediaType,
  CompanyStats,
  JobListItem,
  ApplicationListItem,
  InterviewListItem,
  InterviewDetail,
  InterviewType,
  MessageThread,
  Message,
  Review,
} from '@/types/api';

// ─── Company Services (includes Profile, Dashboard, and Recruitment) ─────────

export const companyService = {
  // ─── Profile CRUD ──────────────────────────────────────────────────────

  /** Get the company's own company profile */
  getMyCompany() {
    return api.get<CompanyDetail>('/api/companies/me/');
  },

  list(params?: { search?: string; industry_id?: number; company_size?: string; ordering?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<CompanyListItem>>('/api/companies/', { params });
  },

  getById(id: number) {
    return api.get<CompanyDetail>(`/api/companies/${id}/`);
  },

  getBySlug(slug: string) {
    return api.get<CompanyDetail>(`/api/companies/slug/${slug}/`);
  },

  create(data: CompanyCreateRequest) {
    return api.post<CompanyDetail>('/api/companies/', data);
  },

  update(id: number, data: CompanyUpdateRequest) {
    return api.patch<CompanyDetail>(`/api/companies/${id}/`, data);
  },

  delete(id: number) {
    return api.delete(`/api/companies/${id}/`);
  },

  // ─── Company Dashboard & Management (previously companyService) ─────────

  getStats() {
    return api.get<CompanyStats>('/api/dashboard/stats/company/');
  },

  listMyJobs(params?: { status?: string; search?: string; ordering?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<JobListItem>>('/api/jobs/', { params });
  },

  listJobApplications(jobId: number, params?: { status?: string; ordering?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<ApplicationListItem>>(`/api/jobs/${jobId}/applications/`, { params });
  },

  // ─── Interviews ───────────────────────────────────────────────────────

  listInterviews(params?: { status?: string; application_id?: number; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<InterviewListItem>>('/api/interviews/', { params });
  },

  getInterview(id: number) {
    return api.get<InterviewDetail>(`/api/interviews/${id}/`);
  },

  createInterview(data: {
    application_id: number;
    interview_type_id: number;
    round_number?: number;
    scheduled_at: string;
    duration_minutes?: number;
    address_id?: number;
    meeting_link?: string;
    notes?: string;
  }) {
    return api.post<InterviewDetail>('/api/interviews/', data);
  },

  updateInterview(id: number, data: Partial<{
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    result: string;
    feedback: string;
    notes: string;
    meeting_link: string;
  }>) {
    return api.patch<InterviewDetail>(`/api/interviews/${id}/`, data);
  },

  deleteInterview(id: number) {
    return api.delete(`/api/interviews/${id}/`);
  },

  listInterviewTypes() {
    return api.get<InterviewType[]>('/api/interview-types/');
  },

  // ─── Verification & Featured ─────────────────────────────────────────────

  requestVerification(id: number) {
    return api.post(`/api/companies/${id}/verify/`);
  },

  listPending(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<CompanyDetail>>('/api/companies/', { params: { verification_status: 'pending', ...params } });
  },

  adminVerify(id: number, status: 'verified' | 'rejected') {
    return api.patch(`/api/companies/${id}/verification/`, { status });
  },

  featured(params?: { page_size?: number }) {
    return api.get<CompanyListItem[]>('/api/companies/featured/', { params });
  },

  // ─── Social: Follow / Reviews ──────────────────────────────────────────

  follow(companyId: number) {
    return api.post(`/api/companies/${companyId}/follow/`);
  },

  unfollow(companyId: number) {
    return api.delete(`/api/companies/${companyId}/unfollow/`);
  },

  isFollowing(companyId: number) {
    return api.get<{ is_following: boolean }>(`/api/companies/${companyId}/is-following/`);
  },

  listFollowers(companyId: number, params?: { page?: number; page_size?: number }) {
    return api.get(`/api/companies/${companyId}/followers/`, { params });
  },

  listReviews(companyId: number, params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Review>>('/api/reviews/', { params: { company_id: companyId, ...params } });
  },

  replyToReview(reviewId: number, content: string) {
    return api.post(`/api/reviews/${reviewId}/reply/`, { content });
  },

  // ─── Nested: Benefits ─────────────────────────────────────────────────

  listBenefits(companyId: number) {
    return api.get<CompanyBenefit[]>(`/api/companies/${companyId}/benefits/`);
  },

  addBenefit(companyId: number, data: { category_id: number; benefit_name: string; description?: string }) {
    return api.post<CompanyBenefit>(`/api/companies/${companyId}/benefits/`, data);
  },

  updateBenefit(companyId: number, benefitId: number, data: Partial<{ benefit_name: string; description: string; display_order: number }>) {
    return api.patch<CompanyBenefit>(`/api/companies/${companyId}/benefits/${benefitId}/`, data);
  },

  removeBenefit(companyId: number, benefitId: number) {
    return api.delete(`/api/companies/${companyId}/benefits/${benefitId}/`);
  },

  // ─── Nested: Media ────────────────────────────────────────────────────

  listMedia(companyId: number) {
    return api.get<CompanyMedia[]>(`/api/companies/${companyId}/media/`);
  },

  addMedia(companyId: number, formData: FormData) {
    return api.post<CompanyMedia>(`/api/companies/${companyId}/media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeMedia(companyId: number, mediaId: number) {
    return api.delete(`/api/companies/${companyId}/media/${mediaId}/`);
  },

  // ─── Taxonomy helpers ─────────────────────────────────────────────────

  listBenefitCategories() {
    return api.get<BenefitCategory[]>('/api/benefit-categories/');
  },

  listMediaTypes() {
    return api.get<MediaType[]>('/api/media-types/');
  },
  // ─── Messages ─────────────────────────────────────────────────────────

  listThreads(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<MessageThread>>('/api/messages/threads/', { params });
  },

  getThread(id: number) {
    return api.get<MessageThread>(`/api/messages/threads/${id}/`);
  },

  createThread(data: { subject: string; participant_ids: number[]; job_id?: number; candidate_id?: number }) {
    return api.post<MessageThread>('/api/messages/threads/', data);
  },

  listMessages(threadId: number, params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Message>>(`/api/messages/threads/${threadId}/messages/`, { params });
  },

  sendMessage(threadId: number, data: { content: string }) {
    return api.post<Message>(`/api/messages/threads/${threadId}/messages/`, data);
  },

  // ─── Notifications ──────────────────────────────────────────────────

  listNotifications(params?: { is_read?: boolean; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<any>>('/api/notifications/', { params });
  },

  markNotificationRead(id: number) {
    return api.patch(`/api/notifications/${id}/read/`);
  },

  markAllNotificationsRead() {
    return api.patch('/api/notifications/read-all/');
  },

  deleteNotification(id: number) {
    return api.delete(`/api/notifications/${id}/`);
  },

  clearAllNotifications() {
    return api.delete('/api/notifications/clear-all/');
  },

  getNotificationSettings() {
    return api.get<any>('/api/notifications/settings/');
  },

  updateNotificationSettings(data: Partial<any>) {
    return api.patch<any>('/api/notifications/settings/', data);
  },
};
