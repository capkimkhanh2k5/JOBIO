import api from './api';
import type { CandidateMatchingJobsResponse } from '@/types/matching';

export const matchingService = {
    getMatchingJobs(recruiterId: number) {
        return api.get<CandidateMatchingJobsResponse>(`/api/recruiters/${recruiterId}/matching-jobs/`);
    },
};
