import api from './api';
import type {
  PaginatedResponse,
  CompanyStats,
  JobListItem,
  ApplicationListItem,
  InterviewListItem,
  InterviewDetail,
  InterviewType,
  Campaign,
  CampaignDetail,
  Notification,
  NotificationSettings,
  MessageThread,
  Message,
  Review,
} from '@/types/api';

// ─── Employer / Company-side services ────────────────────────────────────────

export const employerService = {
  // ─── Dashboard Stats ──────────────────────────────────────────────────

  getStats() {
    return api.get<CompanyStats>('/api/dashboard/stats/company/');
  },

  // ─── My Company Jobs ─────────────────────────────────────────────────

  listMyJobs(params?: { status?: string; search?: string; ordering?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<JobListItem>>('/api/jobs/', { params });
  },

  // ─── Application pipeline for a job ──────────────────────────────────

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

  // ─── Campaigns ────────────────────────────────────────────────────────

  listCampaigns(params?: { status?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Campaign>>('/api/campaigns/', { params });
  },

  getCampaign(id: number) {
    return api.get<CampaignDetail>(`/api/campaigns/${id}/`);
  },

  createCampaign(data: Partial<CampaignDetail>) {
    return api.post<CampaignDetail>('/api/campaigns/', data);
  },

  updateCampaign(id: number, data: Partial<CampaignDetail>) {
    return api.patch<CampaignDetail>(`/api/campaigns/${id}/`, data);
  },

  deleteCampaign(id: number) {
    return api.delete(`/api/campaigns/${id}/`);
  },

  // ─── Notifications ────────────────────────────────────────────────────

  listNotifications(params?: { is_read?: boolean; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Notification>>('/api/notifications/', { params });
  },

  markNotificationRead(id: number) {
    return api.patch(`/api/notifications/${id}/read/`);
  },

  markAllNotificationsRead() {
    return api.patch('/api/notifications/read-all/');
  },

  getNotificationSettings() {
    return api.get<NotificationSettings>('/api/notifications/settings/');
  },

  updateNotificationSettings(data: Partial<NotificationSettings>) {
    return api.patch<NotificationSettings>('/api/notifications/settings/', data);
  },

  // ─── Messages ─────────────────────────────────────────────────────────

  listThreads(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<MessageThread>>('/api/messages/threads/', { params });
  },

  getThread(id: number) {
    return api.get<MessageThread>(`/api/messages/threads/${id}/`);
  },

  createThread(data: { subject: string; participant_ids: number[]; job_id?: number; application_id?: number }) {
    return api.post<MessageThread>('/api/messages/threads/', data);
  },

  listMessages(threadId: number, params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Message>>(`/api/messages/threads/${threadId}/messages/`, { params });
  },

  sendMessage(threadId: number, data: { content: string }) {
    return api.post<Message>(`/api/messages/threads/${threadId}/messages/`, data);
  },

  // ─── Reviews ──────────────────────────────────────────────────────────

  listReviews(companyId: number, params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Review>>('/api/reviews/', { params: { company_id: companyId, ...params } });
  },

  replyToReview(reviewId: number, content: string) {
    return api.post(`/api/reviews/${reviewId}/reply/`, { content });
  },
};
