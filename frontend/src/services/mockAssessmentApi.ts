import type { AssessmentTest, AssessmentQuestion, TestResult, PaginatedResponse } from '@/types/api';
// Helper for delay

// Helper for delay
const simulateLatency = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const mockCategories = [
    { id: 1, name: 'Lập trình frontend' },
    { id: 2, name: 'Lập trình backend' },
    { id: 3, name: 'Kỹ năng mềm' },
    { id: 4, name: 'Ngoại ngữ' },
];

export const mockAssessmentTests: AssessmentTest[] = [
    {
        id: 1,
        title: 'React.js Frontend Assessment',
        slug: 'reactjs-frontend-assessment',
        category: mockCategories[0],
        test_type: 'technical',
        difficulty_level: 'intermediate',
        duration_minutes: 30,
        total_questions: 10,
        passing_score: 70,
        max_retakes: 3,
        retake_wait_days: 7,
        is_active: true,
        is_public: true,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
        id: 2,
        title: 'Python Backend Developer',
        slug: 'python-backend-developer',
        category: mockCategories[1],
        test_type: 'technical',
        difficulty_level: 'advanced',
        duration_minutes: 45,
        total_questions: 15,
        passing_score: 75,
        max_retakes: 2,
        retake_wait_days: 14,
        is_active: true,
        is_public: true,
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
        id: 3,
        title: 'Logical Reasoning & Aptitude',
        slug: 'logical-reasoning-aptitude',
        category: null,
        test_type: 'aptitude',
        difficulty_level: 'beginner',
        duration_minutes: 20,
        total_questions: 20,
        passing_score: 60,
        max_retakes: 5,
        retake_wait_days: 1,
        is_active: true,
        is_public: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        id: 4,
        title: 'Business English - Intermediate',
        slug: 'business-english-intermediate',
        category: mockCategories[3],
        test_type: 'language',
        difficulty_level: 'intermediate',
        duration_minutes: 40,
        total_questions: 25,
        passing_score: 65,
        max_retakes: 3,
        retake_wait_days: 7,
        is_active: true,
        is_public: true,
        created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
];

const mockQuestions: Record<number, AssessmentQuestion[]> = {
    1: [
        {
            id: 101,
            test_id: 1,
            question_type: 'multiple_choice',
            points: 10,
            question_data: {
                text: 'What hook is used to manage side effects in React?',
                options: ['useState', 'useContext', 'useEffect', 'useReducer'],
                answer: 'useEffect',
            },
        },
        {
            id: 102,
            test_id: 1,
            question_type: 'multiple_choice',
            points: 10,
            question_data: {
                text: 'In React, components return...',
                options: ['HTML', 'JSX', 'Functions', 'CSS'],
                answer: 'JSX',
            },
        },
        {
            id: 103,
            test_id: 1,
            question_type: 'text_input',
            points: 20,
            question_data: {
                text: 'Which hook should you use to access a DOM element directly?',
            },
        },
    ],
};

let mockTestResults: TestResult[] = [
    {
        id: 1001,
        assessment_test: {
            id: 2,
            title: 'Python Backend Developer',
            test_type: 'technical',
            passing_score: 75,
            difficulty_level: 'advanced',
        },
        score: 80,
        percentage_score: 80,
        passed: true,
        time_taken_minutes: 38,
        certificate_url: 'https://example.com/certificate/1001',
        detailed_results: null,
        started_at: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
];

export const mockAssessmentService = {
    async getTests(params?: { category_id?: number; test_type?: string; difficulty_level?: string; page?: number; page_size?: number }) {
        await simulateLatency();
        let results = [...mockAssessmentTests];

        if (params?.category_id) {
            results = results.filter((t) => t.category?.id === params.category_id);
        }
        if (params?.test_type) {
            results = results.filter((t) => t.test_type === params.test_type);
        }
        if (params?.difficulty_level) {
            results = results.filter((t) => t.difficulty_level === params.difficulty_level);
        }

        const pageSize = params?.page_size || 10;
        const page = params?.page || 1;
        const paginated = results.slice((page - 1) * pageSize, page * pageSize);

        return {
            count: results.length,
            next: null,
            previous: null,
            results: paginated,
        } as PaginatedResponse<AssessmentTest>;
    },

    async getCategories() {
        await simulateLatency();
        return mockCategories;
    },

    async getTest(id: number) {
        await simulateLatency();
        const test = mockAssessmentTests.find((t) => t.id === id);
        if (!test) throw new Error('Test not found');
        return test;
    },

    async getQuestions(testId: number) {
        await simulateLatency();
        const questions = mockQuestions[testId];
        if (!questions) return []; // mock fallback
        return questions;
    },

    async startTest(testId: number) {
        await simulateLatency();
        const test = mockAssessmentTests.find((t) => t.id === testId);
        if (!test) throw new Error('Test not found');

        const previousResults = mockTestResults.filter((r) => r.assessment_test.id === testId);
        if (previousResults.length >= test.max_retakes) {
            throw new Error(`You have reached the maximum retakes (${test.max_retakes}) for this test.`);
        }

        if (previousResults.length > 0) {
            const lastResult = previousResults[previousResults.length - 1];
            const waitTime = test.retake_wait_days * 24 * 60 * 60 * 1000;
            const timeSinceLast = Date.now() - new Date(lastResult.completed_at).getTime();
            if (timeSinceLast < waitTime) {
                throw new Error(`You must wait ${test.retake_wait_days} days before retaking this test.`);
            }
        }

        return { success: true, session_id: `mock-session-${Date.now()}` };
    },

    async submitTest(testId: number, answers: Record<string, unknown>) {
        await simulateLatency(1000);
        const test = mockAssessmentTests.find((t) => t.id === testId);
        if (!test) throw new Error('Test not found');

        // Mock evaluation logic
        let score = Math.floor(Math.random() * 41) + 60; // 60 to 100
        const passed = score >= test.passing_score;

        const result: TestResult = {
            id: Date.now(),
            assessment_test: {
                id: test.id,
                title: test.title,
                test_type: test.test_type,
                passing_score: test.passing_score,
                difficulty_level: test.difficulty_level,
            },
            score,
            percentage_score: score,
            passed,
            time_taken_minutes: Math.floor(test.duration_minutes * 0.8),
            certificate_url: passed ? `https://example.com/certificate/${Date.now()}` : null,
            detailed_results: answers,
            started_at: new Date(Date.now() - 1000000).toISOString(),
            completed_at: new Date().toISOString(),
        };

        mockTestResults.push(result);
        return result;
    },

    async getMyTestResults(params?: { page?: number; page_size?: number }) {
        await simulateLatency();
        const pageSize = params?.page_size || 10;
        const page = params?.page || 1;

        // Sort desc by completed_at
        const sorted = [...mockTestResults].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
        const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

        return {
            count: sorted.length,
            next: null,
            previous: null,
            results: paginated,
        } as PaginatedResponse<TestResult>;
    },

    async getTestResult(id: number) {
        await simulateLatency();
        const res = mockTestResults.find((r) => r.id === id);
        if (!res) throw new Error('Result not found');
        return res;
    },
};
