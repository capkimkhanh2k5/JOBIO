import type { Review, CompanyBrief, PaginatedResponse } from '@/types/api';
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
