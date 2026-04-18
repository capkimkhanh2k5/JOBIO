import api from './api';

// ─── Company Analytics Types ────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  new_applications_30d: number;
  applications_delta: number;
  total_views: number;
  hired_count: number;
  hire_rate: number;
  interview_count: number;
}

export interface TimeSeriesPoint {
  date: string;
  full_date: string;
  applications: number;
  views: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

export interface StatusBreakdown {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface TopJob {
  id: number;
  title: string;
  status: string;
  applications: number;
  views: number;
  interviews: number;
  hired: number;
  conversion_rate: number;
  published_at: string | null;
}

export interface CompanyAnalyticsData {
  summary: AnalyticsSummary;
  time_series: TimeSeriesPoint[];
  funnel: FunnelStage[];
  status_breakdown: StatusBreakdown[];
  top_jobs: TopJob[];
}

// ─── Analytics Service ───────────────────────────────────────────────────────

export const analyticsService = {
  /** GET /api/dashboard/stats/company-analytics/ */
  getCompanyAnalytics() {
    return api.get<CompanyAnalyticsData>('/api/dashboard/stats/company-analytics/');
  },
};
