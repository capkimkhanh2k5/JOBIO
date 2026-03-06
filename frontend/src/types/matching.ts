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
    id: string;
    candidate_id: string;
    job_id: string;
    name: string;
    avatar?: string;
    headline: string;
    overall_score: number;
    breakdown: MatchScoreBreakdown;
    insights: MatchInsight[];
    last_calculated: string;
    match_status: 'excellent' | 'good' | 'average' | 'poor';
}

export interface TopMatchSummary {
    job_id: string;
    job_title: string;
    candidate_name: string;
    overall_score: number;
}

export interface AIInsightsResponse {
    summary: string;
    key_highlights: string[];
    recommendation: string;
}
