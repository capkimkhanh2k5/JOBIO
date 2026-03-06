import { mockAssessmentService } from './mockAssessmentApi';

// If you want to use the real API later, switch to api.get(...)
// For now, we will proxy calls to the mock services as per instructions

export const assessmentService = {
    getTests: mockAssessmentService.getTests,
    getCategories: mockAssessmentService.getCategories,
    getTest: mockAssessmentService.getTest,
    getQuestions: mockAssessmentService.getQuestions,
    startTest: mockAssessmentService.startTest,
    submitTest: mockAssessmentService.submitTest,
    getMyTestResults: mockAssessmentService.getMyTestResults,
    getTestResult: mockAssessmentService.getTestResult,
};
