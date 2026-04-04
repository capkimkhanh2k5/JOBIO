import api from './api';
import type {
  PaginatedResponse,
  RecruiterCV,
  CVCreateRequest,
  CVUpdateRequest,
  CVTemplate,
  CVTemplateCategory,
} from '@/types/api';

// ─── CV / Resume Service ─────────────────────────────────────────────────────

export const cvService = {
  // ─── Recruiter CVs (nested under recruiter) ───────────────────────────

  list(recruiterId: number) {
    return api.get<RecruiterCV[]>(`/api/recruiters/${recruiterId}/cvs/`);
  },

  getById(recruiterId: number, cvId: number) {
    return api.get<RecruiterCV>(`/api/recruiters/${recruiterId}/cvs/${cvId}/`);
  },

  create(recruiterId: number, data: CVCreateRequest) {
    return api.post<RecruiterCV>(`/api/recruiters/${recruiterId}/cvs/`, data);
  },

  update(recruiterId: number, cvId: number, data: CVUpdateRequest) {
    return api.patch<RecruiterCV>(`/api/recruiters/${recruiterId}/cvs/${cvId}/`, data);
  },

  delete(recruiterId: number, cvId: number) {
    return api.delete(`/api/recruiters/${recruiterId}/cvs/${cvId}/`);
  },

  /** Upload a PDF/DOCX CV file (backend: generate endpoint) */
  uploadFile(recruiterId: number, file: File, cvName?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (cvName) formData.append('cv_name', cvName);
    return api.post<RecruiterCV>(`/api/recruiters/${recruiterId}/cvs/generate/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Set as default CV */
  setDefault(recruiterId: number, cvId: number) {
    return api.patch(`/api/recruiters/${recruiterId}/cvs/${cvId}/default/`);
  },

  /** Download / generate PDF */
  downloadPdf(recruiterId: number, cvId: number) {
    return api.post(`/api/recruiters/${recruiterId}/cvs/${cvId}/download/`, {}, {
      responseType: 'blob',
    });
  },

  // ─── CV Templates ─────────────────────────────────────────────────────

  listTemplates(params?: { category_id?: number; is_premium?: boolean; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<CVTemplate>>('/api/cv-templates/', { params });
  },

  getTemplate(id: number) {
    return api.get<CVTemplate>(`/api/cv-templates/${id}/`);
  },

  listTemplateCategories() {
    return api.get<CVTemplateCategory[]>('/api/cv-templates/categories/');
  },

  /**
   * Render a template with real recruiter data → returns { html: string }
   * Used for template picker preview (without a specific CV)
   */
  renderTemplatePreview(templateId: number, recruiterId: number) {
    return api.post<{ html: string }>(`/api/cv-templates/${templateId}/preview/`, {
      recruiter_id: recruiterId,
    });
  },

  /**
   * Preview a specific CV using its stored cv_data → returns { html_content: string }
   * This uses the CV's actual cv_data (which the user has edited), plus its assigned template.
   */
  previewCv(recruiterId: number, cvId: number) {
    return api.post<{ html_content: string; template_id: number }>(
      `/api/recruiters/${recruiterId}/cvs/${cvId}/preview/`
    );
  },
};
