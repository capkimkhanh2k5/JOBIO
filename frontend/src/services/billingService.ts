import api from './api';

export interface SubscriptionPlanAPI {
    id: number;
    name: string;
    slug: string;
    price: string;           // DecimalField comes as string from DRF
    currency: string;
    duration_days: number;
    features: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
}

export const billingService = {
    /** GET /api/billing/subscription-plans/ — public, no auth required */
    listPlans(params?: { page?: number; page_size?: number }) {
        return api.get<SubscriptionPlanAPI[]>('/api/billing/subscription-plans/', { params });
    },

    getPlan(slug: string) {
        return api.get<SubscriptionPlanAPI>(`/api/billing/subscription-plans/${slug}/`);
    },

    /** GET /api/billing/company-subscriptions/current/ — employer only */
    getCurrentSubscription() {
        return api.get('/api/billing/company-subscriptions/current/');
    },

    /** POST /api/billing/company-subscriptions/subscribe/ */
    subscribe(planId: number) {
        return api.post('/api/billing/company-subscriptions/subscribe/', { plan_id: planId });
    },
};
