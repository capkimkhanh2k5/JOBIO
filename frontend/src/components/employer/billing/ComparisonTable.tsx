import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import type { BillingPlan } from '@/types/api';

interface ComparisonTableProps {
    plans: BillingPlan[];
}

const COMPARISON_FEATURES = [
    { key: 'max_jobs', label: 'Số tin đăng tối đa', type: 'number' },
    { key: 'max_featured_jobs', label: 'Tin nổi bật', type: 'number' },
    { key: 'max_cv_views', label: 'Lượt xem hồ sơ', type: 'number' },
    { key: 'can_export_cv', label: 'Mở rộng/Xuất hồ sơ', type: 'boolean' },
    { key: 'has_ai_matching', label: 'AI Matching thông minh', type: 'boolean' },
    { key: 'has_priority_support', label: 'Hỗ trợ 24/7 ưu tiên', type: 'boolean' },
    { key: 'support', label: 'Kênh hỗ trợ', type: 'text', free: 'Email', basic: 'Email + Chat', professional: 'Hotline 24/7', enterprise: 'Dedicated Manager' },
];

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ plans }) => {
    return (
        <div className="rounded-3xl bg-white border border-white shadow-2xl shadow-blue-500/10 overflow-hidden mt-12 transition-all duration-500 hover:shadow-blue-500/20">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-900 text-center tracking-tight">So sánh chi tiết các tính năng</h3>
            </div>


            <Table>
                <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="text-slate-500 w-[200px] sm:w-[300px]">Tính năng</TableHead>
                        {plans.map((plan) => (
                            <TableHead key={plan.id} className="text-center">
                                <span className={cn(
                                    "font-bold",
                                    plan.plan_type === 'professional' ? "text-cyan-600" : "text-slate-900"
                                )}>
                                    {plan.name}
                                </span>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {COMPARISON_FEATURES.map((feature, idx) => (
                        <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-slate-700 font-medium py-4">{feature.label}</TableCell>
                            {plans.map((plan) => (
                                <TableCell key={plan.id} className="text-center py-4">
                                    {renderFeatureValue(feature, plan)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>

            </Table>
        </div>
    );
};

const renderFeatureValue = (feature: any, plan: BillingPlan) => {
    if (feature.type === 'boolean') {
        const isIncluded = plan.features[feature.key as keyof typeof plan.features];
        return isIncluded ? (
            <div className="flex justify-center">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                </div>
            </div>
        ) : (
            <div className="flex justify-center">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground/30 flex items-center justify-center">
                    <X className="w-4 h-4" />
                </div>
            </div>
        );
    }

    if (feature.type === 'number') {
        return (
            <span className="text-foreground font-semibold">
                {plan.features[feature.key as keyof typeof plan.features] || '0'}
            </span>
        );
    }

    if (feature.type === 'text') {
        return (
            <span className="text-muted-foreground text-sm font-medium">
                {feature[plan.plan_type]}
            </span>
        );
    }

    return null;
};

