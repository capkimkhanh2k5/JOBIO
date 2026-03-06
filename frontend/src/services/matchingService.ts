import { mockMatchingService } from './mockApi';
import { JobMatch } from '@/types/matching';

export const matchingService = {
    getMatchingJobs: async (recruiterId: number) => {
        // In a real app, this would be:
        // return api.get(`/api/recruiters/${recruiterId}/matching-jobs/`);
        return mockMatchingService.getMatchingJobs(recruiterId);
    },

    getJobMatchScore: async (jobId: number, recruiterId: number) => {
        // In a real app, this would be:
        // return api.get(`/api/jobs/${jobId}/match-score/`);
        return mockMatchingService.getJobMatchScore(jobId, recruiterId);
    }
};
