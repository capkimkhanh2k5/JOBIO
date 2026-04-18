import api from './api';
import type {
  PaginatedResponse,
  CandidateListItem,
  CandidateDetail,
  CandidateUpdateRequest,
  CandidateEducation,
  CandidateEducationRequest,
  CandidateExperience,
  CandidateExperienceRequest,
  CandidateSkill,
  CandidateSkillRequest,
  CandidateCertification,
  CandidateCertificationRequest,
  CandidateLanguage,
  CandidateLanguageRequest,
  CandidateProject,
  CandidateProjectRequest,
} from '@/types/api';

// ─── Candidate / Candidate Profiles ──────────────────────────────────────────

export const candidateService = {
  // ─── Profile ──────────────────────────────────────────────────────────

  list(params?: { search?: string; job_search_status?: string; ordering?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<CandidateListItem>>('/api/candidates/', { params });
  },

  getById(id: number) {
    return api.get<CandidateDetail>(`/api/candidates/${id}/`);
  },

  /** Shortcut: get the current user's candidate profile */
  getMyProfile() {
    return api.get<CandidateDetail>('/api/candidates/me/');
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
  
  getProfileCompleteness(id: number) {
    return api.get<{ score: number; checklist: any[] }>(`/api/candidates/${id}/profile-completeness/`);
  },

  update(id: number, data: CandidateUpdateRequest) {
    return api.patch<CandidateDetail>(`/api/candidates/${id}/`, data);
  },

  // ─── Education ────────────────────────────────────────────────────────

  listEducation(candidateId: number) {
    return api.get<CandidateEducation[]>(`/api/candidates/${candidateId}/education/`);
  },

  addEducation(candidateId: number, data: CandidateEducationRequest) {
    return api.post<CandidateEducation>(`/api/candidates/${candidateId}/education/`, data);
  },

  updateEducation(candidateId: number, eduId: number, data: Partial<CandidateEducationRequest>) {
    return api.patch<CandidateEducation>(`/api/candidates/${candidateId}/education/${eduId}/`, data);
  },

  deleteEducation(candidateId: number, eduId: number) {
    return api.delete(`/api/candidates/${candidateId}/education/${eduId}/`);
  },

  // ─── Experience ───────────────────────────────────────────────────────

  listExperience(candidateId: number) {
    return api.get<CandidateExperience[]>(`/api/candidates/${candidateId}/experience/`);
  },

  addExperience(candidateId: number, data: CandidateExperienceRequest) {
    return api.post<CandidateExperience>(`/api/candidates/${candidateId}/experience/`, data);
  },

  updateExperience(candidateId: number, expId: number, data: Partial<CandidateExperienceRequest>) {
    return api.patch<CandidateExperience>(`/api/candidates/${candidateId}/experience/${expId}/`, data);
  },

  deleteExperience(candidateId: number, expId: number) {
    return api.delete(`/api/candidates/${candidateId}/experience/${expId}/`);
  },

  // ─── Skills ───────────────────────────────────────────────────────────

  listSkills(candidateId: number) {
    return api.get<CandidateSkill[]>(`/api/candidates/${candidateId}/skills/`);
  },

  addSkill(candidateId: number, data: CandidateSkillRequest) {
    return api.post<CandidateSkill>(`/api/candidates/${candidateId}/skills/`, data);
  },

  updateSkill(candidateId: number, skillId: number, data: Partial<CandidateSkillRequest>) {
    return api.patch<CandidateSkill>(`/api/candidates/${candidateId}/skills/${skillId}/`, data);
  },

  deleteSkill(candidateId: number, skillId: number) {
    return api.delete(`/api/candidates/${candidateId}/skills/${skillId}/`);
  },

  // ─── Certifications ──────────────────────────────────────────────────

  listCertifications(candidateId: number) {
    return api.get<CandidateCertification[]>(`/api/candidates/${candidateId}/certifications/`);
  },

  addCertification(candidateId: number, data: CandidateCertificationRequest) {
    return api.post<CandidateCertification>(`/api/candidates/${candidateId}/certifications/`, data);
  },

  updateCertification(candidateId: number, certId: number, data: Partial<CandidateCertificationRequest>) {
    return api.patch<CandidateCertification>(`/api/candidates/${candidateId}/certifications/${certId}/`, data);
  },

  deleteCertification(candidateId: number, certId: number) {
    return api.delete(`/api/candidates/${candidateId}/certifications/${certId}/`);
  },

  // ─── Languages ────────────────────────────────────────────────────────

  listLanguages(candidateId: number) {
    return api.get<CandidateLanguage[]>(`/api/candidates/${candidateId}/languages/`);
  },

  addLanguage(candidateId: number, data: CandidateLanguageRequest) {
    return api.post<CandidateLanguage>(`/api/candidates/${candidateId}/languages/`, data);
  },

  updateLanguage(candidateId: number, langId: number, data: Partial<CandidateLanguageRequest>) {
    return api.patch<CandidateLanguage>(`/api/candidates/${candidateId}/languages/${langId}/`, data);
  },

  deleteLanguage(candidateId: number, langId: number) {
    return api.delete(`/api/candidates/${candidateId}/languages/${langId}/`);
  },

  // ─── Projects ─────────────────────────────────────────────────────────

  listProjects(candidateId: number) {
    return api.get<CandidateProject[]>(`/api/candidates/${candidateId}/projects/`);
  },

  addProject(candidateId: number, data: CandidateProjectRequest) {
    return api.post<CandidateProject>(`/api/candidates/${candidateId}/projects/`, data);
  },

  updateProject(candidateId: number, projId: number, data: Partial<CandidateProjectRequest>) {
    return api.patch<CandidateProject>(`/api/candidates/${candidateId}/projects/${projId}/`, data);
  },

  deleteProject(candidateId: number, projId: number) {
    return api.delete(`/api/candidates/${candidateId}/projects/${projId}/`);
  },

  // ─── Interviews ────────────────────────────────────────────────────────

  listInterviews(params?: { status?: string; application_id?: number; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<any>>('/api/interviews/', { params });
  },
};

// ─── Recommendations (Real API) ──────────────────────────────────────────────
import type {
  Recommendation,
  RecommendationCreateRequest,
  RecommendationUpdateRequest,
} from '@/types/api';

export interface RecommendationsResponse {
  candidate_id: number;
  recommendations: Recommendation[];
  total: number;
}

export const recommendationService = {
  getRecommendations(candidateId: number) {
    return api.get<RecommendationsResponse>(`/api/candidates/${candidateId}/recommendations/`).then(r => r.data);
  },

  writeRecommendation(candidateId: number, data: RecommendationCreateRequest) {
    return api.post<Recommendation>(`/api/candidates/${candidateId}/recommend/`, data);
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
