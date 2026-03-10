// ─── Assessment Service – Real API ──────────────────────────────────────────
import api from './api';
import type {
    AssessmentTest,
    AssessmentQuestion,
    TestResult,
    PaginatedResponse,
} from '@/types/api';

export const assessmentService = {
    /** GET /api/assessment-tests/ */
    async getTests(params?: {
        category_id?: number;
        test_type?: string;
        difficulty_level?: string;
        page?: number;
        page_size?: number;
    }) {
        const { data } = await api.get<PaginatedResponse<AssessmentTest>>(
            '/api/assessment-tests/',
            { params },
        );
        return data;
    },

    /** GET /api/assessment-tests/categories/ */
    async getCategories() {
        const { data } = await api.get<{ id: number; name: string }[]>(
            '/api/assessment-tests/categories/',
        );
        return data;
    },

    /** GET /api/assessment-tests/:id/ */
    async getTest(id: number) {
        const { data } = await api.get<AssessmentTest>(`/api/assessment-tests/${id}/`);
        return data;
    },

    /** GET /api/assessment-tests/:id/ (questions are included in detail or via start) */
    async getQuestions(testId: number) {
        const { data } = await api.get<AssessmentQuestion[]>(
            `/api/assessment-tests/${testId}/questions/`,
        );
        return data;
    },

    /** POST /api/assessment-tests/:id/start/ */
    async startTest(testId: number) {
        const { data } = await api.post<{ success: boolean; session_id: string }>(
            `/api/assessment-tests/${testId}/start/`,
        );
        return data;
    },

    /** POST /api/assessment-tests/:id/submit/ */
    async submitTest(testId: number, answers: Record<string, unknown>) {
        const { data } = await api.post<TestResult>(
            `/api/assessment-tests/${testId}/submit/`,
            { answers },
        );
        return data;
    },

    /** GET /api/assessment-tests/:id/results/ */
    async getMyTestResults(params?: { page?: number; page_size?: number }) {
        const { data } = await api.get<PaginatedResponse<TestResult>>(
            '/api/test-results/',
            { params },
        );
        return data;
    },

    /** GET /api/test-results/:id/ */
    async getTestResult(id: number) {
        const { data } = await api.get<TestResult>(`/api/test-results/${id}/`);
        return data;
    },
};
