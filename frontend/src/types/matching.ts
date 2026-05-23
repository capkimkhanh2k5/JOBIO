export interface MatchScoreBreakdown {
  skill_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  salary_match_score: number;
}

export interface MatchInsight {
  type: 'strength' | 'weakness' | 'info';
  message: string;
}

export interface CandidateMatch {
  id: number | string;
  candidate_id?: number | string;
  name: string;
  headline: string;
  avatar?: string;
  overall_score: number;
  match_status: 'excellent' | 'good' | 'fair' | 'poor' | string;
  breakdown: MatchScoreBreakdown;
  insights: MatchInsight[];
}

export interface AIInsightsResponse {
  summary: string;
  key_highlights: string[];
  recommendation: string;
}
