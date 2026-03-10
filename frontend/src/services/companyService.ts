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
} from '@/types/api';

// ─── Companies ───────────────────────────────────────────────────────────────

export const companyService = {
  // ─── CRUD ──────────────────────────────────────────────────────────────

  /** Get the employer's own company */
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

  // ─── Actions ─────────────────────────────────────────────────────────────

  requestVerification(id: number) {
    return api.post(`/api/companies/${id}/verify/`);
  },

  /** Admin: list companies pending verification */
  listPending(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<CompanyDetail>>('/api/companies/', { params: { verification_status: 'pending', ...params } });
  },

  /** Admin: approve or reject a company */
  adminVerify(id: number, status: 'verified' | 'rejected') {
    return api.patch(`/api/companies/${id}/verification/`, { status });
  },

  featured(params?: { page_size?: number }) {
    return api.get<CompanyListItem[]>('/api/companies/featured/', { params });
  },

  // ─── Follow / Unfollow ────────────────────────────────────────────────

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
};
