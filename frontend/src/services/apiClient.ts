// ─── Real API services (backed by Axios → Django REST) ──────────────────────
// Central barrel — import individual service modules and re-export for easy consumption.

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
export { notificationService } from './notificationService';
export { assessmentService } from './assessmentService';
export { mockReviewService, mockConnectionService } from './mockApi';
