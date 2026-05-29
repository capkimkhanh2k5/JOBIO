import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardKpiCardProps {
    icon: React.ReactNode;
    label: string;
    value?: number;
    formattedValue?: string;
    deltaValue?: number;
    unit?: string;
    iconGradient?: string;
    iconTone?: {
        bg: string;
        text: string;
        border: string;
        hoverBg?: string;
    };
    isLoading?: boolean;
    note?: string;
    layout?: 'stacked' | 'inlineValue';
    className?: string;
}

export function DashboardKpiCard({
    icon,
    label,
    value,
    formattedValue,
    deltaValue,
    unit,
    iconGradient = 'from-violet-500 to-violet-600',
    iconTone,
    isLoading,
    note,
    layout = 'stacked',
    className,
}: DashboardKpiCardProps) {
    if (isLoading) {
        return (
            <div
                className={cn(
                    'bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-y-3',
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-7 w-20" />
            </div>
        );
    }

    const displayValue =
        formattedValue ??
        (value !== undefined ? value.toLocaleString('vi-VN') : '—');

    const trend =
        deltaValue === undefined
            ? null
            : deltaValue > 0
                ? 'up'
                : deltaValue < 0
                    ? 'down'
                    : 'flat';

    const deltaIndicator = deltaValue !== undefined && (
        <div
            className={cn(
                'flex items-center gap-1 mt-2 text-xs font-semibold w-fit px-1.5 py-0.5 rounded-md',
                trend === 'up' && 'text-emerald-600 bg-emerald-50',
                trend === 'down' && 'text-red-600 bg-red-50',
                trend === 'flat' && 'text-slate-500 bg-slate-50'
            )}
        >
            {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
            ) : trend === 'down' ? (
                <TrendingDown className="w-3.5 h-3.5" />
            ) : (
                <Minus className="w-3.5 h-3.5" />
            )}
            <span>
                {deltaValue > 0 ? '+' : ''}
                {deltaValue}% so với tuần trước
            </span>
        </div>
    );

    if (layout === 'inlineValue') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className={cn(
                    'bg-white border shadow-sm hover:shadow-md rounded-2xl p-5 relative overflow-hidden group cursor-default flex gap-4 items-start',
                    iconTone ? iconTone.border : 'border-slate-200',
                    className
                )}
            >
                <div
                    className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none',
                        iconTone?.hoverBg ?? 'bg-violet-50/40'
                    )}
                />
                <div
                    className={cn(
                        'w-10 h-10 rounded-xl flex shrink-0 items-center justify-center shadow-sm group-hover:shadow-md transition-shadow relative z-10',
                        iconTone ? iconTone.bg : cn('bg-gradient-to-br', iconGradient)
                    )}
                >
                    <span className={cn(iconTone ? iconTone.text : 'text-white')}>{icon}</span>
                </div>
                <div className="min-w-0 flex-1 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <p className="min-w-0 text-sm text-slate-600 font-semibold leading-snug">
                            {label}
                        </p>
                        <div className="flex shrink-0 items-baseline justify-end gap-1.5 text-right">
                            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                {displayValue}
                            </span>
                            {unit && (
                                <span className="text-xs text-slate-500 font-medium">{unit}</span>
                            )}
                        </div>
                    </div>
                    {deltaIndicator}
                    {note && (
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-snug">{note}</p>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className={cn(
                'bg-white border shadow-sm hover:shadow-md rounded-2xl p-4 relative overflow-hidden group cursor-default',
                iconTone ? iconTone.border : 'border-slate-200',
                className
            )}
        >
            <div
                className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none',
                    iconTone?.hoverBg ?? 'bg-violet-50/40'
                )}
            />
            <div className="relative z-10 flex min-w-0 items-center gap-3">
                <div
                    className={cn(
                        'w-10 h-10 rounded-xl flex shrink-0 items-center justify-center shadow-sm group-hover:shadow-md transition-shadow',
                        iconTone ? iconTone.bg : cn('bg-gradient-to-br', iconGradient)
                    )}
                >
                    <span className={cn(iconTone ? iconTone.text : 'text-white')}>{icon}</span>
                </div>
                <p className="min-w-0 flex-1 text-sm text-slate-600 font-semibold leading-snug">
                    {label}
                </p>
            </div>
            <div className="relative z-10 mt-4">
                <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                        {displayValue}
                    </span>
                    {unit && (
                        <span className="text-xs text-slate-500 font-medium">{unit}</span>
                    )}
                </div>
                {deltaIndicator}
                {note && (
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-snug">{note}</p>
                )}
            </div>
        </motion.div>
    );
}
