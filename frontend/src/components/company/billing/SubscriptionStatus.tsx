import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
    Calendar, 
    CheckCircle2,
    Crown, 
    Zap, 
    Briefcase,
    Star,
    XCircle,
    ZapOff,
    Rocket
} from 'lucide-react';
import { BillingSubscription } from '@/types/api';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SubscriptionStatusProps {
    subscription?: BillingSubscription | null;
    onCancel?: () => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscription }) => {
    const hasActiveSubscription = !!subscription && subscription.plan.slug !== 'free';

    if (!hasActiveSubscription) {
        return (
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-violet-50/50 blur-3xl group-hover:bg-violet-100 transition-colors duration-700" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 border border-slate-100 group-hover:scale-110 group-hover:text-violet-400 transition-all duration-500">
                        <ZapOff className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1">Chưa có gói dịch vụ</h3>
                    <p className="text-xs text-slate-500 font-medium mb-5 px-4">Nâng cấp ngay để mở khóa các công cụ tuyển dụng chuyên nghiệp.</p>
                    <Link to="/pricing" className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-[11px] font-black hover:bg-slate-800 transition-all flex items-center gap-2">
                        Khám phá các gói <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </Link>
                </div>
            </div>
        );
    }

    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.round((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    const planDisplayName = subscription.plan.name.split(' (')[0].toUpperCase();
    
    // Usage data from BE
    const usage = subscription.usage || {
        jobs: { current: 0, limit: 0 },
        featured_jobs: { current: 0, limit: 0 },
        cv_views: { current: 0, limit: 0 },
        ai_matching: { enabled: false }
    };
    const topJobEnabled = Boolean(subscription.plan.features?.top_job ?? usage.featured_jobs.limit > 0);

    const planSlug = (subscription.plan.slug || '').toLowerCase();
    
    // Plan theme configuration to match Pricing page
    const planThemes = {
        plus: {
            icon: Briefcase,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            borderColor: "border-blue-100",
            labelBg: "bg-blue-50 text-blue-700 border-blue-100",
            glowColor: "from-blue-600 via-blue-400 to-blue-600"
        },
        pro: {
            icon: Rocket,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-500",
            borderColor: "border-orange-200",
            labelBg: "bg-orange-50 text-orange-700 border-orange-200",
            glowColor: "from-orange-600 via-orange-400 to-orange-600"
        },
        max: {
            icon: Crown,
            bgColor: "bg-amber-100",
            iconColor: "text-amber-600",
            borderColor: "border-amber-200",
            labelBg: "bg-amber-50 text-amber-700 border-amber-200",
            glowColor: "from-amber-600 via-yellow-400 to-amber-600"
        },
        default: {
            icon: Zap,
            bgColor: "bg-slate-900",
            iconColor: "text-amber-400",
            borderColor: "border-slate-800",
            labelBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
            glowColor: "from-violet-600 via-fuchsia-500 to-violet-600"
        }
    };

    const theme = planThemes[planSlug.includes('plus') ? 'plus' : planSlug.includes('pro') ? 'pro' : planSlug.includes('max') ? 'max' : 'default'];
    const PlanIcon = theme.icon;

    return (
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg transition-all duration-500 hover:shadow-xl hover:border-violet-200">
            {/* Premium Header Gradient */}
            <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r z-20", theme.glowColor)} />
            
            <div className="p-6 lg:p-7">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-xl ring-4 ring-slate-50 border transition-transform duration-500 hover:scale-105",
                            theme.bgColor,
                            theme.iconColor,
                            theme.borderColor
                        )}>
                            <PlanIcon className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{planDisplayName}</h3>
                                <div className={cn("px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center", theme.labelBg)}>
                                    <div className="w-1 h-1 rounded-full bg-current mr-1.5 animate-pulse" />
                                    Active
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400">
                                <span className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                    Hết hạn: {format(endDate, 'dd/MM/yyyy', { locale: vi })}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className={cn(
                            "text-2xl font-black leading-none mb-1 tracking-tighter",
                            daysRemaining < 7 ? "text-rose-500" : "text-slate-900"
                        )}>
                            {daysRemaining}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày còn lại</div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="space-y-4">
                    <MetricRow 
                        icon={Briefcase} 
                        label="Tin tuyển dụng" 
                        current={usage.jobs.current}
                        limit={usage.jobs.limit}
                        color="violet"
                    />
                    <FeatureStatusRow
                        icon={Star}
                        label="Tin đăng nổi bật"
                        enabled={topJobEnabled}
                    />
                </div>

                {/* AI Status Badge */}
                {usage.ai_matching.enabled && (
                    <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            AI Matching Enabled
                        </div>
                        <Link to="/pricing" className="text-[10px] font-black text-violet-600 hover:text-violet-700 transition-colors">
                            Manage Plan →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

const FeatureStatusRow = ({ icon: Icon, label, enabled }: {
    icon: any;
    label: string;
    enabled: boolean;
}) => {
    const StatusIcon = enabled ? CheckCircle2 : XCircle;

    return (
        <div className="group/row">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center text-amber-500 bg-amber-50 transition-transform group-hover/row:scale-110">
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">{label}</span>
                </div>
                <div className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[10px] font-black uppercase tracking-wider",
                    enabled
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-slate-100 bg-slate-50 text-slate-400"
                )}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {enabled ? 'Có hỗ trợ' : 'Không hỗ trợ'}
                </div>
            </div>
        </div>
    );
};

const MetricRow = ({ icon: Icon, label, current, limit, color }: { 
    icon: any; 
    label: string; 
    current: number; 
    limit: number;
    color: 'violet' | 'amber' | 'indigo' | 'emerald';
}) => {
    const iconColors = {
        violet: "text-violet-500 bg-violet-50",
        amber: "text-amber-500 bg-amber-50",
        indigo: "text-indigo-500 bg-indigo-50",
        emerald: "text-emerald-500 bg-emerald-50",
    };

    const barColors = {
        violet: "bg-violet-500",
        amber: "bg-amber-500",
        indigo: "bg-indigo-500",
        emerald: "bg-emerald-500",
    };

    const percentage = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;

    return (
        <div className="group/row">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover/row:scale-110", iconColors[color])}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">{label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-900">{current}</span>
                    <span className="text-[10px] font-bold text-slate-300">/ {limit}</span>
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-sm", barColors[color])} 
                />
            </div>
        </div>
    );
};

