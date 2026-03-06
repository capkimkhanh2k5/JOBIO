import { CandidateMatch, TopMatchSummary, AIInsightsResponse } from '../types/matching';

const simulateLatency = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_CANDIDATES: CandidateMatch[] = [
    {
        id: 'match-1',
        candidate_id: 'cand-1',
        job_id: 'job-1',
        name: 'Phạm Minh Hoàng',
        avatar: 'https://i.pravatar.cc/150?u=cand1',
        headline: 'Senior Frontend Engineer | React & TypeScript Expert',
        overall_score: 94,
        match_status: 'excellent',
        breakdown: {
            skill_match_score: 98,
            experience_match_score: 92,
            education_match_score: 85,
            location_match_score: 100,
            salary_match_score: 95,
        },
        insights: [
            { type: 'strength', message: 'Kỹ năng React và Next.js vượt mong đợi (98%).' },
            { type: 'strength', message: 'Đã có kinh nghiệm làm việc tại các công ty cùng quy mô.' },
            { type: 'info', message: 'Ứng viên đang tìm kiếm mức lương cạnh tranh.' }
        ],
        last_calculated: new Date().toISOString(),
    },
    {
        id: 'match-2',
        candidate_id: 'cand-2',
        job_id: 'job-1',
        name: 'Lê Thị Mai',
        avatar: 'https://i.pravatar.cc/150?u=cand2',
        headline: 'Mid-level Web Developer | UX Enthusiast',
        overall_score: 82,
        match_status: 'good',
        breakdown: {
            skill_match_score: 85,
            experience_match_score: 75,
            education_match_score: 90,
            location_match_score: 100,
            salary_match_score: 80,
        },
        insights: [
            { type: 'strength', message: 'Trình độ học vấn cao, phù hợp với yêu cầu tối thiểu.' },
            { type: 'info', message: 'Cần bổ sung thêm kinh nghiệm về các hệ thống phân tán.' }
        ],
        last_calculated: new Date().toISOString(),
    },
    {
        id: 'match-3',
        candidate_id: 'cand-3',
        job_id: 'job-1',
        name: 'Nguyễn Văn Nam',
        avatar: 'https://i.pravatar.cc/150?u=cand3',
        headline: 'Frontend Developer | Vue.js Specialists',
        overall_score: 65,
        match_status: 'average',
        breakdown: {
            skill_match_score: 60,
            experience_match_score: 70,
            education_match_score: 75,
            location_match_score: 50,
            salary_match_score: 70,
        },
        insights: [
            { type: 'weakness', message: 'Thiếu kinh nghiệm làm việc với React (Tech stack chính).' },
            { type: 'info', message: 'Vị trí hiện tại ở xa so với trụ sở công ty.' }
        ],
        last_calculated: new Date().toISOString(),
    }
];

export const matchingService = {
    async getMatchingCandidates(_jobId: string): Promise<CandidateMatch[]> {
        await simulateLatency(800);
        return MOCK_CANDIDATES;
    },

    async calculateMatch(_jobId: string, _recruiterId: string): Promise<CandidateMatch> {
        await simulateLatency(1200);
        return MOCK_CANDIDATES[0];
    },

    async batchCalculate(_jobId: string): Promise<{ success: boolean; message: string }> {
        await simulateLatency(1500);
        return { success: true, message: 'Batch calculation completed for all candidates.' };
    },

    async getTopMatches(limit: number = 10): Promise<TopMatchSummary[]> {
        await simulateLatency(600);
        return [
            { job_id: 'job-1', job_title: 'Senior React Developer', candidate_name: 'Phạm Minh Hoàng', overall_score: 94 },
            { job_id: 'job-1', job_title: 'Senior React Developer', candidate_name: 'Lê Thị Mai', overall_score: 82 },
            { job_id: 'job-2', job_title: 'Product Designer', candidate_name: 'Nguyễn Anh Tuấn', overall_score: 88 },
            { job_id: 'job-2', job_title: 'Product Designer', candidate_name: 'Trần Minh Tâm', overall_score: 85 },
            { job_id: 'job-3', job_title: 'Backend Engineer', candidate_name: 'Lê Quang Đạo', overall_score: 91 },
        ].slice(0, limit);
    },

    async getMatchInsights(_jobId: string, _candidateId: string): Promise<AIInsightsResponse> {
        await simulateLatency(1000);
        return {
            summary: 'Ứng viên Phạm Minh Hoàng có sự tương đồng cực cao với mô tả công việc của Senior React Developer.',
            key_highlights: [
                'Thành thạo React/TypeScript với hơn 5 năm kinh nghiệm.',
                'Đã từng dẫn dắt các dự án quy mô lớn tương tự dự án "Aurora".',
                'Kỹ năng giải quyết vấn đề và tối ưu hóa performance xuất sắc.'
            ],
            recommendation: 'Ưu tiên phỏng vấn ngay trong tuần này. Ứng viên đang ở giai đoạn cuối của quy trình tuyển dụng tại 2 công ty khác.'
        };
    },

    async refreshScores(): Promise<{ refreshed_count: number }> {
        await simulateLatency(1000);
        return { refreshed_count: MOCK_CANDIDATES.length };
    }
};
