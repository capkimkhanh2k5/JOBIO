import api from './api';
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
