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
        <Card className="bg-white border border-slate-100 shadow-xl overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:border-cyan-100">



            {/* Subtle Aurora Gradient Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="p-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            isFree ? "bg-muted text-muted-foreground/50" : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-lg shadow-cyan-500/10"
                        )}>

                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gói hiện tại</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-slate-900">{subscription.plan.name}</span>
                                {subscription.status === 'active' ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                ) : (
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {subscription.status}
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>

                    {!isFree && (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" className="border-border/50 bg-background/50 hover:bg-muted text-foreground rounded-xl h-10 px-4">
                                <Link to="/employer/subscription">Nâng cấp</Link>
                            </Button>
                        </div>
                    )}

                </div>

                {!isFree && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> THỜI HẠN CÒN LẠI
                                </span>
                                <span className="text-2xl font-black text-slate-900">{daysRemaining} ngày</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">{formatDate(subscription.end_date)}</span>
                        </div>

                        <div className="relative pt-1">
                            <Progress value={progressPercent} className="h-2 bg-muted/50" />
                            <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${progressPercent}%` }} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/30">

                            <StatItem label="Tin đăng" current={1} max={subscription.plan.features.max_jobs} />
                            <StatItem label="Nổi bật" current={0} max={subscription.plan.features.max_featured_jobs} />
                            <StatItem label="Lượt xem CV" current={5} max={subscription.plan.features.max_cv_views} />
                            <StatItem label="Xuất CV" active={subscription.plan.features.can_export_cv} />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <Button className="flex-1 bg-primary text-primary-foreground hover:opacity-90 rounded-xl h-12 font-bold group shadow-lg shadow-primary/20">
                                <ArrowUpCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                Gia hạn gói
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl h-12 transition-colors"
                            >
                                <XCircle className="w-5 h-5 mr-2" />
                                Hủy gia hạn tự động
                            </Button>
                        </div>

                    </div>
                )}

                {isFree && (
                    <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 dark:border-cyan-500/20">
                        <p className="text-sm text-foreground/60 mb-4">
                            Bạn đang sử dụng gói Miễn phí. Hãy nâng cấp để tăng khả năng tiếp cận hàng ngàn ứng viên tiềm năng và sử dụng AI Matching.
                        </p>
                        <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white border-none rounded-xl h-10 font-bold shadow-lg shadow-cyan-500/20">
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
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1">
            {max !== undefined ? (
                <>
                    <span className="text-lg font-bold text-slate-900">{current}</span>
                    <span className="text-sm text-slate-300">/ {max}</span>
                </>
            ) : (
                <span className={cn("text-xs font-bold", active ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground/30")}>
                    {active ? "Khả dụng" : "Không có"}
                </span>
            )}
        </div>
    </div>
);

