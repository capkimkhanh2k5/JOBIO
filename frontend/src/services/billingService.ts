import api from './api';
import type {
    BillingPlan,
    BillingSubscription,
    BillingTransaction,
    SubscriptionCreateRequest,
    SubscribeResponse,
    SubscriptionPreCheckResponse,
    PaginatedResponse,
} from '@/types/api';

// Type alias consumed by Pricing.tsx
export type SubscriptionPlanAPI = BillingPlan;

export const billingService = {
    /** GET /api/billing/subscription-plans/ — public, no auth required */
    listPlans() {
        return api.get<BillingPlan[]>('/api/billing/subscription-plans/');
    },

    getPlan(slug: string) {
        return api.get<BillingPlan>(`/api/billing/subscription-plans/${slug}/`);
    },

    /** GET /api/billing/company-subscriptions/current/ — company only */
    getCurrentSubscription() {
        return api.get<BillingSubscription>('/api/billing/company-subscriptions/current/');
    },

    /** POST /api/billing/company-subscriptions/subscribe/ */
    subscribe(data: SubscriptionCreateRequest) {
        return api.post<SubscribeResponse>('/api/billing/company-subscriptions/subscribe/', data);
    },

    /** GET /api/billing/company-subscriptions/pre-check/?plan_id= */
    preCheckSubscription(planId: number) {
        return api.get<SubscriptionPreCheckResponse>('/api/billing/company-subscriptions/pre-check/', {
            params: { plan_id: planId },
        });
    },

    /** POST /api/billing/company-subscriptions/cancel/ */
    cancelSubscription(_id: number) {
        return api.post<BillingSubscription>(`/api/billing/company-subscriptions/cancel/`);
    },

    /** GET /api/billing/transactions/ */
    listTransactions(params?: { 
        status?: string; 
        start_date?: string; 
        end_date?: string; 
        method?: string; 
        search?: string;
        page?: number 
    }) {
        return api.get<PaginatedResponse<BillingTransaction>>('/api/billing/transactions/', { params });
    },

    /** GET /api/billing/transactions/:id/ */
    getTransaction(id: string) {
        return api.get<BillingTransaction>(`/api/billing/transactions/${id}/`);
    },
};
