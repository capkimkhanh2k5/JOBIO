import { mockBillingService } from './mockApi';
import type {
    SavedPaymentMethod,
    SubscriptionCreateRequest
} from '@/types/api';

export const billingService = {
    /** GET /api/billing/subscription-plans/ — public, no auth required */
    async listPlans() {
        const res = await mockBillingService.getPlans();
        return { data: res };
    },

    async getPlan(slug: string) {
        // In mockApi getPlanDetail uses ID, but we can search by slug
        const plans = await mockBillingService.getPlans();
        const plan = plans.find(p => p.slug === slug);
        if (!plan) throw new Error("Plan not found");
        return { data: plan };
    },

    /** GET /api/billing/company-subscriptions/current/ — employer only */
    async getCurrentSubscription() {
        const res = await mockBillingService.getMySubscriptions(1); // Default to company 1
        return { data: res };
    },

    /** POST /api/billing/company-subscriptions/subscribe/ */
    async subscribe(data: SubscriptionCreateRequest) {
        const res = await mockBillingService.createSubscription(data);
        return { data: res };
    },

    /** GET /api/billing/transactions/ */
    async listTransactions(params?: { status?: string; start_date?: string; end_date?: string; method?: string; page?: number }) {
        const res = await mockBillingService.getTransactions(params);
        return { data: res };
    },

    /** GET /api/billing/transactions/:id/ */
    async getTransaction(id: string) {
        const res = await mockBillingService.getTransactionDetail(id);
        return { data: res };
    },

    /** GET /api/billing/payment-methods/ */
    async listPaymentMethods() {
        const res = await mockBillingService.getPaymentMethods();
        return { data: res };
    },

    /** POST /api/billing/payment-methods/ */
    async addPaymentMethod(data: Partial<SavedPaymentMethod>) {
        const res = await mockBillingService.addPaymentMethod(data);
        return { data: res };
    },

    /** PATCH /api/billing/payment-methods/:id/ */
    async updatePaymentMethod(id: string, data: Partial<SavedPaymentMethod>) {
        // Not implemented in mockApi but easy to simulate
        return { data: { ...data, id } };
    },

    /** DELETE /api/billing/payment-methods/:id/ */
    async deletePaymentMethod(id: string) {
        const res = await mockBillingService.deletePaymentMethod(id);
        return { data: res };
    },

    /** PATCH /api/billing/payment-methods/:id/set-default/ */
    async setDefaultPaymentMethod(id: string) {
        const res = await mockBillingService.setDefaultPaymentMethod(id);
        return { data: res };
    }
};
