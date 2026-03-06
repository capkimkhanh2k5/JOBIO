import type { Review, CompanyBrief, PaginatedResponse, Recommendation, RecommendationCreateRequest, RecommendationUpdateRequest } from '@/types/api';
import type { JobMatch, MatchScoreBreakdown, MatchInsight } from '@/types/matching';
import { delay } from '@/lib/utils'; // if not exists, we'll write a simple delay

// Delay utility if it doesn't exist
const simulateLatency = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Data
let mockReviews: Review[] = [
    {
        id: 1,
        company: { id: 1, company_name: "Tech Corp", logo_url: null },
        recruiter: { id: 101, full_name: "John Doe", avatar_url: null },
        rating: 4.5,
        title: "Môi trường tuyệt vời, đồng nghiệp thân thiện",
        content: "Công ty có môi trường làm việc rất chuyên nghiệp. Các dự án đa dạng và quy trình rõ ràng.",
        pros: "Phúc lợi tốt, có snack miễn phí.",
        cons: "Đôi khi phải OT vào đợt release.",
        work_environment_rating: 5,
        salary_benefits_rating: 4,
        management_rating: 4,
        career_development_rating: 5,
        employment_status: 'current',
        position: 'Senior Frontend Developer',
        employment_duration: '2 năm',
        is_verified: true,
        is_anonymous: false,
        helpful_count: 12,
        status: 'approved',
        created_at: new Date(Date.now() - 10000000).toISOString(),
    },
    {
        id: 2,
        company: { id: 1, company_name: "Tech Corp", logo_url: null },
        recruiter: null,
        rating: 3.0,
        title: "Lương trung bình, quy trình còn rườm rà",
        content: "Công việc ổn định nhưng lương không cạnh tranh lắm so với thị trường.",
        pros: null,
        cons: "Nhiều quy trình giấy tờ.",
        work_environment_rating: 3,
        salary_benefits_rating: 3,
        management_rating: 3,
        career_development_rating: 3,
        employment_status: 'former',
        position: 'Backend Developer',
        employment_duration: '1 năm',
        is_verified: true,
        is_anonymous: true,
        helpful_count: 5,
        status: 'approved',
        created_at: new Date(Date.now() - 50000000).toISOString(),
    }
];

export interface ReviewCreateRequest {
    company_id: number;
    rating: number;
    title: string;
    content: string;
    pros?: string;
    cons?: string;
    work_environment_rating: number;
    salary_benefits_rating: number;
    management_rating: number;
    career_development_rating: number;
    employment_status: 'current' | 'former' | 'intern';
    position?: string;
    employment_duration?: string;
    is_anonymous: boolean;
}

export type ReviewUpdateRequest = Partial<ReviewCreateRequest>;

export const mockReviewService = {
    // ─── Company Reviews ──────────────────────────────────────────────────
    async getCompanyReviews(companyId: number, params?: { page?: number; page_size?: number }) {
        await simulateLatency(800);
        const filtered = mockReviews.filter(r => r.company.id === companyId && r.status === 'approved');

        // Calculate average and breakdown
        const totalRating = filtered.reduce((acc, r) => acc + r.rating, 0);
        const average_rating = filtered.length > 0 ? totalRating / filtered.length : 0;

        const rating_breakdown = [
            { label: '5 sao', rating: filtered.filter(r => Math.round(r.rating) === 5).length },
            { label: '4 sao', rating: filtered.filter(r => Math.round(r.rating) === 4).length },
            { label: '3 sao', rating: filtered.filter(r => Math.round(r.rating) === 3).length },
            { label: '2 sao', rating: filtered.filter(r => Math.round(r.rating) === 2).length },
            { label: '1 sao', rating: filtered.filter(r => Math.round(r.rating) === 1).length },
        ];

        return {
            reviews: filtered,
            average_rating,
            rating_breakdown,
            count: filtered.length,
        };
    },

    async createReview(companyId: number, data: ReviewCreateRequest) {
        await simulateLatency();
        const newReview: Review = {
            id: Date.now(),
            company: { id: companyId, company_name: "Tech Corp", logo_url: null }, // Mock company info
            recruiter: data.is_anonymous ? null : { id: 101, full_name: "Current User", avatar_url: null },
            rating: data.rating,
            title: data.title,
            content: data.content,
            pros: data.pros || null,
            cons: data.cons || null,
            work_environment_rating: data.work_environment_rating,
            salary_benefits_rating: data.salary_benefits_rating,
            management_rating: data.management_rating,
            career_development_rating: data.career_development_rating,
            employment_status: data.employment_status,
            position: data.position || null,
            employment_duration: data.employment_duration || null,
            is_verified: false,
            is_anonymous: data.is_anonymous,
            helpful_count: 0,
            status: 'approved', // Auto-approve for demo
            created_at: new Date().toISOString(),
        };
        mockReviews = [newReview, ...mockReviews];
        return newReview;
    },

    // ─── Candidate Reviews (My Reviews) ──────────────────────────────────
    async getCandidateReviews(recruiterId: number, params?: { page?: number; page_size?: number }) {
        await simulateLatency();
        // Since it's a mock, we just return the first one or specific ones
        const filtered = mockReviews; // Give them all for demo if recruiter doesn't strictly match
        return {
            count: filtered.length,
            next: null,
            previous: null,
            results: filtered
        } as PaginatedResponse<Review>;
    },

    async updateReview(reviewId: number, data: ReviewUpdateRequest) {
        await simulateLatency();
        const index = mockReviews.findIndex(r => r.id === reviewId);
        if (index > -1) {
            mockReviews[index] = { ...mockReviews[index], ...data } as Review;
            return mockReviews[index];
        }
        throw new Error("Review not found");
    },

    async deleteReview(reviewId: number) {
        await simulateLatency();
        mockReviews = mockReviews.filter(r => r.id !== reviewId);
        return { success: true };
    },

    // ─── Actions ────────────────────────────────────────────────────────
    async markHelpful(reviewId: number) {
        await simulateLatency(300);
        const index = mockReviews.findIndex(r => r.id === reviewId);
        if (index > -1) {
            mockReviews[index].helpful_count += 1;
            return mockReviews[index];
        }
        throw new Error("Review not found");
    },

    async reportReview(reviewId: number) {
        await simulateLatency(300);
        return { success: true };
    }
};

// ─── Candidate Connections ────────────────────────────────────────────────
import { Connection, ConnectionSuggestion, RecruiterBrief } from '@/types/api';

const mockRecruiters: RecruiterBrief[] = [
    { id: 101, full_name: "Nguyễn Văn A", avatar_url: "https://i.pravatar.cc/150?u=101", current_position: "Frontend Developer", current_company: "Tech Corp" },
    { id: 102, full_name: "Trần Thị B", avatar_url: "https://i.pravatar.cc/150?u=102", current_position: "UX/UI Designer", current_company: "Design Studio" },
    { id: 103, full_name: "Lê Hoàng C", avatar_url: "https://i.pravatar.cc/150?u=103", current_position: "Backend Developer", current_company: "Dev JSC" },
    { id: 104, full_name: "Phạm Minh D", avatar_url: "https://i.pravatar.cc/150?u=104", current_position: "Product Manager", current_company: "Startup Co." },
    { id: 105, full_name: "Hoàng Ngọc E", avatar_url: "https://i.pravatar.cc/150?u=105", current_position: "Fullstack Developer", current_company: "Agile Inc." },
];

let mockConnections: Connection[] = [
    {
        id: 1,
        requester: mockRecruiters[0],
        recipient: { id: 999, full_name: "Current User", avatar_url: null, current_position: "Software Engineer", current_company: "JOBIO" },
        status: 'accepted',
        message: null,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        id: 2,
        requester: mockRecruiters[1],
        recipient: { id: 999, full_name: "Current User", avatar_url: null, current_position: "Software Engineer", current_company: "JOBIO" },
        status: 'accepted',
        message: null,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
        id: 3,
        requester: mockRecruiters[2],
        recipient: { id: 999, full_name: "Current User", avatar_url: null, current_position: "Software Engineer", current_company: "JOBIO" },
        status: 'pending',
        message: "Hi, I'd like to connect and discuss potential collaborations.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
];

export const mockConnectionService = {
    async getConnections(recruiterId: number, status?: string) {
        await simulateLatency(600);
        let filtered = mockConnections;
        if (status) {
            filtered = filtered.filter(c => c.status === status);
        }
        return {
            count: filtered.length,
            next: null,
            previous: null,
            results: filtered
        };
    },

    async getPendingRequests() {
        await simulateLatency(500);
        const filtered = mockConnections.filter(c => c.status === 'pending');
        return {
            count: filtered.length,
            next: null,
            previous: null,
            results: filtered
        };
    },

    async getConnectionSuggestions(limit: number = 10): Promise<ConnectionSuggestion[]> {
        await simulateLatency(800);
        const allPendingOrAcceptedIds = mockConnections.map(c =>
            c.requester.id === 999 ? c.recipient.id : c.requester.id
        );
        const suggestions = mockRecruiters
            .filter(r => !allPendingOrAcceptedIds.includes(r.id))
            .map(r => ({
                recruiter: r,
                mutual_connections_count: Math.floor(Math.random() * 15),
                common_skills: ['React', 'TypeScript', 'Tailwind CSS'].sort(() => 0.5 - Math.random()).slice(0, 2),
                score: Math.floor(Math.random() * 100),
            }))
            .slice(0, limit);
        return suggestions;
    },

    async sendConnectionRequest(recruiterId: number, message?: string) {
        await simulateLatency(700);
        const target = mockRecruiters.find(r => r.id === recruiterId);
        if (!target) throw new Error("Recruiter not found");

        const newConnection: Connection = {
            id: Date.now(),
            requester: { id: 999, full_name: "Current User", avatar_url: null, current_position: "Software Engineer", current_company: "JOBIO" },
            recipient: target,
            status: 'pending',
            message: message || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        mockConnections = [newConnection, ...mockConnections];
        return newConnection;
    },

    async acceptConnectionRequest(connectionId: number) {
        await simulateLatency(500);
        const index = mockConnections.findIndex(c => c.id === connectionId);
        if (index > -1) {
            mockConnections[index].status = 'accepted';
            mockConnections[index].updated_at = new Date().toISOString();
            return mockConnections[index];
        }
        throw new Error("Connection not found");
    },

    async rejectConnectionRequest(connectionId: number) {
        await simulateLatency(500);
        const index = mockConnections.findIndex(c => c.id === connectionId);
        if (index > -1) {
            mockConnections[index].status = 'rejected';
            mockConnections[index].updated_at = new Date().toISOString();
            return mockConnections[index];
        }
        throw new Error("Connection not found");
    },

    async removeConnection(connectionId: number) {
        await simulateLatency(500);
        mockConnections = mockConnections.filter(c => c.id !== connectionId);
        return { success: true };
    }
};

// ─── Recommendations ──────────────────────────────────────────────────────────

let mockRecommendations: Recommendation[] = [
    {
        id: 1,
        recommender: {
            id: 101,
            full_name: "Nguyễn Văn A",
            avatar_url: "https://i.pravatar.cc/150?u=101",
            current_position: "Frontend Developer",
            current_company: "Tech Corp"
        },
        relationship: "Quản lý trực tiếp",
        content: "Một lập trình viên xuất sắc, luôn hoàn thành công việc đúng tiến độ và có tinh thần trách nhiệm cao. Rất mạnh về React và TypeScript.",
        is_visible: true,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
        id: 2,
        recommender: {
            id: 102,
            full_name: "Trần Thị B",
            avatar_url: "https://i.pravatar.cc/150?u=102",
            current_position: "UX/UI Designer",
            current_company: "Design Studio"
        },
        relationship: "Đồng nghiệp cùng nhóm",
        content: "Làm việc chung rất ăn ý, luôn đóng góp nhiều ý tưởng hay cho UI/UX của dự án. Khả năng giao tiếp và teamwork tuyệt vời.",
        is_visible: true,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
        id: 3,
        recommender: {
            id: 103,
            full_name: "Lê Hoàng C",
            avatar_url: "https://i.pravatar.cc/150?u=103",
            current_position: "Backend Developer",
            current_company: "Dev JSC"
        },
        relationship: "Đồng nghiệp khác bộ phận",
        content: "Kỹ năng giải quyết vấn đề tốt, hỗ trợ backend tích hợp API rất nhiệt tình và chính xác.",
        is_visible: false,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    }
];

export const mockRecommendationService = {
    async getRecommendations(recruiterId: number) {
        await simulateLatency(600);
        // Returns both visible and hidden if it's the current user looking (assume 999 is current user for demo)
        if (recruiterId === 999) {
            return {
                count: mockRecommendations.length,
                results: mockRecommendations
            };
        }
        // If viewing others, only return visible
        const visible = mockRecommendations.filter(r => r.is_visible);
        return {
            count: visible.length,
            results: visible
        };
    },

    async writeRecommendation(recruiterId: number, data: RecommendationCreateRequest) {
        await simulateLatency(700);
        const newRecommendation: Recommendation = {
            id: Date.now(),
            recommender: {
                id: 999,
                full_name: "Current User",
                avatar_url: null,
                current_position: "Software Engineer",
                current_company: "JOBIO"
            },
            relationship: data.relationship,
            content: data.content,
            is_visible: false, // Default requires approval/visibility toggle from receiver
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        // For mock purposes we just add it to the generic pool
        mockRecommendations = [newRecommendation, ...mockRecommendations];
        return newRecommendation;
    },

    async updateRecommendation(id: number, data: RecommendationUpdateRequest) {
        await simulateLatency(500);
        const index = mockRecommendations.findIndex(r => r.id === id);
        if (index > -1) {
            mockRecommendations[index] = { ...mockRecommendations[index], ...data };
            mockRecommendations[index].updated_at = new Date().toISOString();
            return mockRecommendations[index];
        }
        throw new Error("Recommendation not found");
    },

    async toggleVisibility(id: number, isVisible: boolean) {
        await simulateLatency(400);
        const index = mockRecommendations.findIndex(r => r.id === id);
        if (index > -1) {
            mockRecommendations[index].is_visible = isVisible;
            mockRecommendations[index].updated_at = new Date().toISOString();
            return mockRecommendations[index];
        }
        throw new Error("Recommendation not found");
    },

    async deleteRecommendation(id: number) {
        await simulateLatency(500);
        mockRecommendations = mockRecommendations.filter(r => r.id !== id);
        return { success: true };
    }
};

// ─── AI Job Matching (Candidate View) ──────────────────────────────────────

const mockJobMatches: JobMatch[] = [
    {
        id: "match-1",
        job_id: 1,
        title: "Senior Frontend Engineer",
        company_name: "Tech Corp",
        company_logo: "https://api.dicebear.com/7.x/initials/svg?seed=TC",
        overall_score: 94,
        match_status: "excellent",
        location: "Hồ Chí Minh (Remote)",
        salary: "$2,500 - $4,000",
        job_type: "Full-time",
        level: "Senior",
        tags: ["React", "TypeScript", "Tailwind"],
        posted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        breakdown: {
            skill_match_score: 98,
            experience_match_score: 90,
            education_match_score: 85,
            location_match_score: 100,
            salary_match_score: 95
        },
        insights: [
            { type: 'strength', message: 'Kỹ năng React & TypeScript của bạn vượt mong đợi' },
            { type: 'strength', message: 'Kinh nghiệm làm việc tại Tech Corp là một điểm cộng lớn' },
            { type: 'info', message: 'Vị trí này ưu tiên ứng viên có kinh nghiệm Remote' }
        ],
        ai_insights: {
            summary: "Bạn là một ứng viên cực kỳ tiềm năng cho vị trí này nhờ sự kết hợp hoàn hảo giữa kỹ năng technical vững chắc và kinh nghiệm làm việc tại môi trường tương tự.",
            key_highlights: [
                "Thành thạo React & TypeScript 100% khớp yêu cầu",
                "Hơn 5 năm kinh nghiệm làm việc tại các công ty Tech hàng đầu",
                "Sống tại HCM phù hợp với chính sách hybrid của công ty"
            ],
            recommendation: "Hãy nhấn ứng tuyển ngay! Profile của bạn đang đứng Top 3% trong số các ứng viên tiềm năng."
        }
    },
    {
        id: "match-2",
        job_id: 2,
        title: "Product Designer (UI/UX)",
        company_name: "Creative Labs",
        company_logo: "https://api.dicebear.com/7.x/initials/svg?seed=CL",
        overall_score: 87,
        match_status: "excellent",
        location: "Hà Nội",
        salary: "Cạnh tranh",
        job_type: "Full-time",
        level: "Middle",
        tags: ["Figma", "UI Design", "UX Research"],
        posted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        breakdown: {
            skill_match_score: 85,
            experience_match_score: 88,
            education_match_score: 90,
            location_match_score: 75,
            salary_match_score: 92
        },
        insights: [
            { type: 'strength', message: 'Portfolio của bạn rất phù hợp với phong cách thiết kế của công ty' },
            { type: 'info', message: 'Cần cải thiện kỹ năng UX Research để đạt điểm tối đa' }
        ]
    },
    {
        id: "match-3",
        job_id: 3,
        title: "Fullstack Developer (Node/React)",
        company_name: "Startup Engine",
        company_logo: "https://api.dicebear.com/7.x/initials/svg?seed=SE",
        overall_score: 72,
        match_status: "good",
        location: "Đà Nẵng",
        salary: "$1,500 - $2,500",
        job_type: "Contract",
        level: "Middle",
        tags: ["Node.js", "React", "MongoDB"],
        posted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        breakdown: {
            skill_match_score: 70,
            experience_match_score: 72,
            education_match_score: 80,
            location_match_score: 60,
            salary_match_score: 85
        },
        insights: [
            { type: 'weakness', message: 'Thiếu kinh nghiệm làm việc với MongoDB' },
            { type: 'info', message: 'Đà Nẵng có thể yêu cầu di chuyển nếu không làm remote' }
        ]
    }
];

export const mockMatchingService = {
    async getMatchingJobs(recruiterId: number): Promise<{ results: JobMatch[], count: number }> {
        await simulateLatency(1000); // AI matching takes a bit longer
        return {
            results: mockJobMatches,
            count: mockJobMatches.length
        };
    },

    async getJobMatchScore(jobId: number, recruiterId: number): Promise<JobMatch> {
        await simulateLatency(600);
        const match = mockJobMatches.find(m => m.job_id === jobId);
        if (match) return match;

        // Fallback for demo if job not in predefined matches
        return {
            id: `match-${jobId}`,
            job_id: jobId,
            title: "Software Engineer",
            company_name: "JOBIO",
            company_logo: null,
            overall_score: 75,
            match_status: "good",
            location: "Remote",
            salary: "Cạnh tranh",
            job_type: "Full-time",
            level: "Junior",
            tags: ["React", "JavaScript"],
            posted_at: new Date().toISOString(),
            breakdown: {
                skill_match_score: 80,
                experience_match_score: 70,
                education_match_score: 75,
                location_match_score: 90,
                salary_match_score: 65
            },
            insights: [
                { type: 'info', message: 'Bạn có nền tảng tốt cho vị trí này' }
            ]
        };
    }
};
