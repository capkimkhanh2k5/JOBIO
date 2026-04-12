import React from 'react';
import { ShieldCheck, Calendar, ArrowUpCircle, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import type { BillingSubscription } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface SubscriptionStatusProps {
    subscription: BillingSubscription;
    onCancel?: () => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscription, onCancel }) => {
    const isFree = subscription.plan.plan_type === 'free';
    const startDate = new Date(subscription.start_date);
    const endDate = new Date(subscription.end_date);
    const today = new Date();

    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    const daysPassed = Math.round((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const daysRemaining = Math.max(0, Math.round((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    const progressPercent = Math.min(100, (daysPassed / totalDays) * 100);

    return (
        <Card className="bg-white border border-slate-200 overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:border-violet-100 shadow-sm rounded-3xl">
            <div className="p-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all",
                            isFree 
                                ? "bg-slate-50 text-slate-400 border-slate-100" 
                                : "bg-violet-50 text-violet-600 border-violet-100 shadow-violet-100"
                        )}>

                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Gói hiện tại</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{subscription.plan.name}</span>
                                {subscription.status === 'active' ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                ) : (
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-wider border border-amber-100">
                                        {subscription.status}
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>

                    {!isFree && (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-9 px-4 shadow-sm transition-all">
                                <Link to="/employer/subscription">Nâng cấp</Link>
                            </Button>
                        </div>
                    )}

                </div>

                {!isFree && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                    <Calendar className="w-3 h-3" /> THỜI HẠN CÒN LẠI
                                </span>
                                <span className="text-2xl font-black text-slate-900">{daysRemaining} ngày</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{formatDate(subscription.end_date)}</span>
                        </div>

                        <div className="relative pt-1">
                            <Progress value={progressPercent} className="h-2 bg-slate-100 rounded-full overflow-hidden" />
                            <div className="absolute top-1 left-0 h-2 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full shadow-sm" style={{ width: `${progressPercent}%` }} />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">

                            <StatItem label="Tin đăng" current={1} max={subscription.plan.features.max_jobs} />
                            <StatItem label="Nổi bật" current={0} max={subscription.plan.features.max_featured_jobs} />
                            <StatItem label="Lượt xem CV" current={5} max={subscription.plan.features.max_cv_views} />
                            <StatItem label="Xuất CV" active={subscription.plan.features.can_export_cv} />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <Button asChild className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-none rounded-xl h-12 font-bold group shadow-md shadow-violet-100 transition-all border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1">
                                <Link to={`/employer/checkout?planSlug=${subscription.plan.slug}`}>
                                    <ArrowUpCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    Gia hạn gói
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12 transition-all font-bold"
                            >
                                <XCircle className="w-5 h-5 mr-2" />
                                Hủy gia hạn
                            </Button>
                        </div>

                    </div>
                )}

                {isFree && (
                    <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100">
                        <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed font-bold">
                            Bạn đang sử dụng gói Miễn phí. Hãy nâng cấp để tăng khả năng tiếp cận hàng ngàn ứng viên tiềm năng và sử dụng AI Matching.
                        </p>
                        <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-none rounded-xl h-11 font-black shadow-md shadow-violet-200">
                            <Link to="/employer/subscription">Nâng cấp ngay</Link>
                        </Button>
                    </div>
                )}

            </div>
        </Card>
    );
};

const StatItem = ({ label, current, max, active }: { label: string; current?: number; max?: number; active?: boolean }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
        <div className="flex items-center gap-1">
            {max !== undefined ? (
                <>
                    <span className="text-xl font-black text-slate-900">{current}</span>
                    <span className="text-xs text-slate-300 font-bold">/ {max}</span>
                </>
            ) : (
                <span className={cn("text-xs font-black uppercase tracking-wider", active ? "text-violet-600" : "text-slate-300")}>
                    {active ? "Khả dụng" : "Không có"}
                </span>
            )}
        </div>
    </div>
);

