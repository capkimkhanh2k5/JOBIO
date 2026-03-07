import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BillingPlan } from '@/types/api';
import { formatSalary } from '@/lib/utils';

interface PlanCardProps {
    plan: BillingPlan;
    isCurrent?: boolean;
    onSelect: (plan: BillingPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, isCurrent, onSelect }) => {
    const isProfessional = plan.plan_type === 'professional';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            <Card className={cn(
                "relative flex flex-col h-full bg-white border border-slate-100 shadow-xl overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:border-cyan-200",
                isProfessional && "ring-1 ring-cyan-500/10 shadow-cyan-500/5",
                isCurrent && "border-cyan-500"
            )}>


                {/* Aurora Background Effect for Professional Plan */}
                {isProfessional && (
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors" />
                )}

                <div className="p-6 flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                        </div>
                        {isProfessional && (
                            <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500 border-none text-white font-bold">
                                PHỔ BIẾN
                            </Badge>
                        )}
                        {isCurrent && (
                            <Badge variant="outline" className="border-cyan-500/50 text-cyan-600 dark:text-cyan-400">
                                GÓI HIỆN TẠI
                            </Badge>
                        )}
                    </div>

                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-900">
                                {plan.price === 0 ? "0đ" : formatSalary(plan.price, 'VND')}
                            </span>
                            {plan.price > 0 && (
                                <span className="text-slate-400 text-sm font-medium">
                                    /{plan.duration_days === 30 ? 'tháng' : plan.duration_days === 90 ? 'quý' : `${plan.duration_days} ngày`}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <FeatureItem label={`${plan.features.max_jobs} Tin tuyển dụng`} />
                        <FeatureItem label={`${plan.features.max_featured_jobs} Tin nổi bật`} />
                        <FeatureItem label={`${plan.features.max_cv_views} Lượt xem CV`} />
                        <FeatureItem label="Xuất dữ liệu CV" included={plan.features.can_export_cv} />
                        <FeatureItem label="Gợi ý ứng viên AI" included={plan.features.has_ai_matching} />
                        <FeatureItem label="Hỗ trợ ưu tiên" included={plan.features.has_priority_support} />
                    </div>

                    <Button
                        onClick={() => onSelect(plan)}
                        disabled={isCurrent}
                        className={cn(
                            "w-full mt-8 rounded-xl h-12 font-bold transition-all duration-300",
                            isProfessional
                                ? "bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white border-none shadow-lg shadow-cyan-500/20"
                                : "bg-primary/10 hover:bg-primary/20 text-primary border-none"
                        )}
                    >
                        {isCurrent ? "Đang sử dụng" : plan.price === 0 ? "Bắt đầu ngay" : "Chọn gói"}
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

const FeatureItem = ({ label, included = true }: { label: string; included?: boolean }) => (
    <div className={cn("flex items-center gap-3", !included && "opacity-40")}>
        <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
            included ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" : "bg-muted text-muted-foreground"
        )}>
            {included ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
        </div>
        <span className="text-sm text-slate-700 font-medium">{label}</span>
    </div>
);

