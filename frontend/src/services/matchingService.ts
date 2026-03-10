import api from './api';
import type { CandidateMatchingJobsResponse } from '@/types/matching';
import type { MatchingScore } from '@/types/api';

export const matchingService = {
    getMatchingJobs(recruiterId: number) {
        return api.get<CandidateMatchingJobsResponse>(`/api/recruiters/${recruiterId}/matching-jobs/`);
    },

    getJobMatchScore(jobId: number, recruiterId: number) {
        return api.get<MatchingScore>(`/api/ai-matching/${jobId}/${recruiterId}/`);
    },
};
