import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { PlanCard } from '@/components/employer/billing/PlanCard';
import { ComparisonTable } from '@/components/employer/billing/ComparisonTable';
import { SubscriptionStatus } from '@/components/employer/billing/SubscriptionStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import type { BillingPlan } from '@/types/api';

const PlansPage: React.FC = () => {
    const navigate = useNavigate();

    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['billing', 'plans'],
        queryFn: () => billingService.listPlans().then(r => r.data),
    });

    const { data: currentSubscription, isLoading: subLoading } = useQuery({
        queryKey: ['billing', 'current-subscription'],
        queryFn: () => billingService.getCurrentSubscription().then(r => r.data),
    });

    const currentPlan = currentSubscription?.plan;

    const handleSelectPlan = (plan: BillingPlan) => {
        if (plan.price === 0) {
            // Free plan logic if needed, or already have it
            return;
        }
        navigate(`/employer/checkout?planSlug=${plan.slug}`);
    };

    if (plansLoading || subLoading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <Skeleton className="h-12 w-64 bg-muted/40" />
                <Skeleton className="h-48 w-full bg-muted/40 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[500px] w-full bg-muted/40 rounded-3xl" />
                    ))}
                </div>
            </div>

        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-12 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2">Gói dịch vụ</h1>
                <p className="text-muted-foreground">Nâng tầm trải nghiệm tuyển dụng với các tính năng cao cấp từ JOBIO.</p>
            </motion.div>


            {/* Current Subscription Section */}
            {currentSubscription && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <SubscriptionStatus subscription={currentSubscription} />
                </motion.div>
            )}

            {/* Plans Section */}
            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Lựa chọn gói phù hợp với mục tiêu của bạn</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Chúng tôi cung cấp các gói dịch vụ linh hoạt để hỗ trợ doanh nghiệp ở mọi quy mô tìm kiếm nhân tài tốt nhất.
                    </p>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans?.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                        >
                            <PlanCard
                                plan={plan}
                                isCurrent={currentPlan?.id === plan.id}
                                onSelect={handleSelectPlan}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Comparison Table Section */}
            {plans && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <ComparisonTable plans={plans} />
                </motion.div>
            )}

            {/* FAQ Link / Quick Support */}
            <div className="text-center pt-8">
                <p className="text-muted-foreground mb-4">Bạn có câu hỏi về các gói dịch vụ?</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <button className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold transition-colors">Xem FAQ</button>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <button className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold transition-colors">Liên hệ tư vấn (09xx xxx xxx)</button>
                </div>
            </div>

        </div>
    );
};

export default PlansPage;
