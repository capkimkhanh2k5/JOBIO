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
  // TODO: Backend chưa có /me/ action trong RecruiterViewSet — cần thêm @action(detail=False, methods=['get'], url_path='me')
  getMyProfile() {
    return api.get<RecruiterDetail>('/api/recruiters/me/');
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
