import api from './api';
import type {
  PaginatedResponse,
  RecruiterListItem,
  RecruiterDetail,
  RecruiterUpdateRequest,
  RecruiterEducation,
  RecruiterEducationRequest,
  RecruiterExperience,
  RecruiterExperienceRequest,
  RecruiterSkill,
  RecruiterSkillRequest,
  RecruiterCertification,
  RecruiterCertificationRequest,
  RecruiterLanguage,
  RecruiterLanguageRequest,
  RecruiterProject,
  RecruiterProjectRequest,
} from '@/types/api';

// ─── Candidate / Recruiter Profiles ──────────────────────────────────────────

export const candidateService = {
  // ─── Profile ──────────────────────────────────────────────────────────

  list(params?: { search?: string; job_search_status?: string; ordering?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<RecruiterListItem>>('/api/recruiters/', { params });
  },

  getById(id: number) {
    return api.get<RecruiterDetail>(`/api/recruiters/${id}/`);
  },

  /** Shortcut: get the current user's recruiter profile */
  getMyProfile() {
    return api.get<RecruiterDetail>('/api/recruiters/me/');
  },

  /** Dashboard stats for the current candidate */
  getMyStats() {
    return api.get<{
      applied_jobs_count: number;
      upcoming_interviews_count: number;
      profile_views_count: number;
      matching_jobs_count: number;
    }>('/api/dashboard/stats/candidate/');
  },

  update(id: number, data: RecruiterUpdateRequest) {
    return api.patch<RecruiterDetail>(`/api/recruiters/${id}/`, data);
  },

  // ─── Education ────────────────────────────────────────────────────────

  listEducation(recruiterId: number) {
    return api.get<RecruiterEducation[]>(`/api/recruiters/${recruiterId}/education/`);
  },

  addEducation(recruiterId: number, data: RecruiterEducationRequest) {
    return api.post<RecruiterEducation>(`/api/recruiters/${recruiterId}/education/`, data);
  },

  updateEducation(recruiterId: number, eduId: number, data: Partial<RecruiterEducationRequest>) {
    return api.patch<RecruiterEducation>(`/api/recruiters/${recruiterId}/education/${eduId}/`, data);
  },

  deleteEducation(recruiterId: number, eduId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/education/${eduId}/`);
  },

  // ─── Experience ───────────────────────────────────────────────────────

  listExperience(recruiterId: number) {
    return api.get<RecruiterExperience[]>(`/api/recruiters/${recruiterId}/experience/`);
  },

  addExperience(recruiterId: number, data: RecruiterExperienceRequest) {
    return api.post<RecruiterExperience>(`/api/recruiters/${recruiterId}/experience/`, data);
  },

  updateExperience(recruiterId: number, expId: number, data: Partial<RecruiterExperienceRequest>) {
    return api.patch<RecruiterExperience>(`/api/recruiters/${recruiterId}/experience/${expId}/`, data);
  },

  deleteExperience(recruiterId: number, expId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/experience/${expId}/`);
  },

  // ─── Skills ───────────────────────────────────────────────────────────

  listSkills(recruiterId: number) {
    return api.get<RecruiterSkill[]>(`/api/recruiters/${recruiterId}/skills/`);
  },

  addSkill(recruiterId: number, data: RecruiterSkillRequest) {
    return api.post<RecruiterSkill>(`/api/recruiters/${recruiterId}/skills/`, data);
  },

  updateSkill(recruiterId: number, skillId: number, data: Partial<RecruiterSkillRequest>) {
    return api.patch<RecruiterSkill>(`/api/recruiters/${recruiterId}/skills/${skillId}/`, data);
  },

  deleteSkill(recruiterId: number, skillId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/skills/${skillId}/`);
  },

  // ─── Certifications ──────────────────────────────────────────────────

  listCertifications(recruiterId: number) {
    return api.get<RecruiterCertification[]>(`/api/recruiters/${recruiterId}/certifications/`);
  },

  addCertification(recruiterId: number, data: RecruiterCertificationRequest) {
    return api.post<RecruiterCertification>(`/api/recruiters/${recruiterId}/certifications/`, data);
  },

  updateCertification(recruiterId: number, certId: number, data: Partial<RecruiterCertificationRequest>) {
    return api.patch<RecruiterCertification>(`/api/recruiters/${recruiterId}/certifications/${certId}/`, data);
  },

  deleteCertification(recruiterId: number, certId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/certifications/${certId}/`);
  },

  // ─── Languages ────────────────────────────────────────────────────────

  listLanguages(recruiterId: number) {
    return api.get<RecruiterLanguage[]>(`/api/recruiters/${recruiterId}/languages/`);
  },

  addLanguage(recruiterId: number, data: RecruiterLanguageRequest) {
    return api.post<RecruiterLanguage>(`/api/recruiters/${recruiterId}/languages/`, data);
  },

  updateLanguage(recruiterId: number, langId: number, data: Partial<RecruiterLanguageRequest>) {
    return api.patch<RecruiterLanguage>(`/api/recruiters/${recruiterId}/languages/${langId}/`, data);
  },

  deleteLanguage(recruiterId: number, langId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/languages/${langId}/`);
  },

  // ─── Projects ─────────────────────────────────────────────────────────

  listProjects(recruiterId: number) {
    return api.get<RecruiterProject[]>(`/api/recruiters/${recruiterId}/projects/`);
  },

  addProject(recruiterId: number, data: RecruiterProjectRequest) {
    return api.post<RecruiterProject>(`/api/recruiters/${recruiterId}/projects/`, data);
  },

  updateProject(recruiterId: number, projId: number, data: Partial<RecruiterProjectRequest>) {
    return api.patch<RecruiterProject>(`/api/recruiters/${recruiterId}/projects/${projId}/`, data);
  },

  deleteProject(recruiterId: number, projId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/projects/${projId}/`);
  },
};

// ─── Recommendations (Real API) ──────────────────────────────────────────────
import type {
  Recommendation,
  RecommendationCreateRequest,
  RecommendationUpdateRequest,
} from '@/types/api';

export interface RecommendationsResponse {
  recruiter_id: number;
  recommendations: Recommendation[];
  total: number;
}

export const recommendationService = {
  getRecommendations(recruiterId: number) {
    return api.get<RecommendationsResponse>(`/api/recruiters/${recruiterId}/recommendations/`).then(r => r.data);
  },

  writeRecommendation(recruiterId: number, data: RecommendationCreateRequest) {
    return api.post<Recommendation>(`/api/recruiters/${recruiterId}/recommend/`, data);
  },

  updateRecommendation(id: number, data: RecommendationUpdateRequest) {
    return api.put<Recommendation>(`/api/recommendations/${id}/`, data);
  },

  toggleVisibility(id: number, isVisible: boolean) {
    return api.patch<Recommendation>(`/api/recommendations/${id}/visibility/`, { is_visible: isVisible });
  },

  deleteRecommendation(id: number) {
    return api.delete(`/api/recommendations/${id}/`);
  },
};
