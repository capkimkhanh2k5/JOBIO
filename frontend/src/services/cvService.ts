import api from './api';
import type {
  PaginatedResponse,
  CandidateCV,
  CVCreateRequest,
  CVUpdateRequest,
  CVTemplate,
  CVTemplateCategory,
} from '@/types/api';

// ─── CV / Resume Service ─────────────────────────────────────────────────────

export const cvService = {
  // ─── Candidate CVs (nested under candidate) ───────────────────────────

  list(candidateId: number) {
    return api.get<CandidateCV[]>(`/api/candidates/${candidateId}/cvs/`);
  },

  getById(candidateId: number, cvId: number) {
    return api.get<CandidateCV>(`/api/candidates/${candidateId}/cvs/${cvId}/`);
  },

  create(candidateId: number, data: CVCreateRequest) {
    return api.post<CandidateCV>(`/api/candidates/${candidateId}/cvs/`, data);
  },

  update(candidateId: number, cvId: number, data: CVUpdateRequest) {
    return api.patch<CandidateCV>(`/api/candidates/${candidateId}/cvs/${cvId}/`, data);
  },

  delete(candidateId: number, cvId: number) {
    return api.delete(`/api/candidates/${candidateId}/cvs/${cvId}/`);
  },

  /** Upload a PDF/DOCX CV file (backend: generate endpoint) */
  uploadFile(candidateId: number, file: File, cvName?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (cvName) formData.append('cv_name', cvName);
    return api.post<CandidateCV>(`/api/candidates/${candidateId}/cvs/generate/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Upload a PDF file directly as a CV_Upload (backend: upload endpoint) */
  uploadPdfFile(candidateId: number, file: File, cvName?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (cvName) formData.append('cv_name', cvName);
    return api.post<CandidateCV>(
      `/api/candidates/${candidateId}/cvs/upload/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /** Save a CV_Template as PDF (force regenerate) */
  savePdf(candidateId: number, cvId: number) {
    return api.post<{ download_url: string; format: string; message: string }>(
      `/api/candidates/${candidateId}/cvs/${cvId}/download/`,
      { force: true }
    );
  },

  /** Set as default CV */
  setDefault(candidateId: number, cvId: number) {
    return api.patch(`/api/candidates/${candidateId}/cvs/${cvId}/default/`);
  },

  /** Download / generate PDF */
  downloadPdf(candidateId: number, cvId: number) {
    return api.post(`/api/candidates/${candidateId}/cvs/${cvId}/download/`, {}, {
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
   * Render a template with real candidate data → returns { html: string }
   * Used for template picker preview (without a specific CV)
   */
  renderTemplatePreview(templateId: number, candidateId: number) {
    return api.post<{ html: string }>(`/api/cv-templates/${templateId}/preview/`, {
      candidate_id: candidateId,
    });
  },

  /**
   * Preview a specific CV using its stored cv_data → returns { html_content: string }
   * This uses the CV's actual cv_data (which the user has edited), plus its assigned template.
   */
  previewCv(candidateId: number, cvId: number) {
    return api.post<{ html_content: string; template_id: number }>(
      `/api/candidates/${candidateId}/cvs/${cvId}/preview/`
    );
  },
};
