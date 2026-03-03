// ─── Real API services (backed by Axios → Django REST) ──────────────────────
// Import individual service modules and re-export them for easy consumption.
// The legacy `mockApi` is kept available during the migration transition.

export { default as api } from './api';
export { authService } from './authService';
export { jobService } from './jobService';
export { companyService } from './companyService';
export { applicationService } from './applicationService';
export { candidateService } from './candidateService';
export { savedJobService } from './savedJobService';
export { cvService } from './cvService';
export { alertService } from './alertService';
export { taxonomyService } from './taxonomyService';
export { employerService } from './employerService';
export { dashboardService } from './dashboardService';

// Legacy mock – pages not yet migrated can still use this
import { mockApi } from './mockApi';
export { mockApi };

/** @deprecated Use individual service modules instead (authService, jobService, etc.) */
export const apiClient = mockApi;
