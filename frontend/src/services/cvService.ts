import axios from 'axios';
import api from './api';
import type {
  PaginatedResponse,
  CandidateCV,
  CloudinaryRawUploadResponse,
  CVCreateRequest,
  CVDirectUploadSignature,
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

  createDirectUploadSignature(candidateId: number, cvName?: string) {
    return api.post<CVDirectUploadSignature>(
      `/api/candidates/${candidateId}/cvs/upload/signature/`,
      { cv_name: cvName }
    );
  },

  completeDirectUpload(
    candidateId: number,
    upload: CloudinaryRawUploadResponse,
    cvName?: string
  ) {
    return api.post<CandidateCV>(
      `/api/candidates/${candidateId}/cvs/upload/complete/`,
      {
        cv_name: cvName,
        secure_url: upload.secure_url,
        public_id: upload.public_id,
        resource_type: upload.resource_type,
        bytes: upload.bytes,
        format: upload.format,
      }
    );
  },

  /** Signed direct upload to Cloudinary, then backend validation/finalization. */
  async uploadPdfFile(candidateId: number, file: File, cvName?: string) {
    const { data: signature } = await this.createDirectUploadSignature(candidateId, cvName);

    if (file.size > signature.max_bytes) {
      throw new Error(`PDF exceeds ${signature.max_bytes} bytes`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.api_key);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);
    formData.append('public_id', signature.public_id);
    formData.append('overwrite', signature.overwrite);
    formData.append('allowed_formats', signature.allowed_formats);

    const upload = await axios.post<CloudinaryRawUploadResponse>(
      signature.upload_url,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      }
    );

    return this.completeDirectUpload(candidateId, upload.data, cvName ?? signature.cv_name);
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
