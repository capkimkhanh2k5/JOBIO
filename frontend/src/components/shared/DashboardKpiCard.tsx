import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardKpiCardProps {
    /** Lucide icon element */
    icon: React.ReactNode;
    /** Metric label */
    label: string;
    /** Numeric value (used when formattedValue is not provided) */
    value?: number;
    /** Override display string (e.g. formatted currency) */
    formattedValue?: string;
    /** Trend delta — positive = up, negative = down, 0 = flat */
    deltaValue?: number;
    /** Unit suffix displayed after the value */
    unit?: string;
    /** Tailwind gradient classes for the icon background (e.g. "from-violet-500 to-violet-600") */
    iconGradient?: string;
    /** Admin-style tinted icon and matching card border classes */
    iconTone?: {
        bg: string;
        text: string;
        border: string;
        hoverBg?: string;
    };
    /** Show skeleton loading state */
    isLoading?: boolean;
    /** Optional sub-note rendered inside the card below the delta indicator */
    note?: string;
    /** Additional container class names */
    className?: string;
}

/**
 * DashboardKpiCard — Unified KPI metric card for all dashboard modules.
 *
 * Follows the admin design language: clean white card, gradient icon,
 * optional trend indicator. Use this instead of module-specific KPI cards.
 *
 * @see UI_RULES.md §7
 */
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
    className,
}: DashboardKpiCardProps) {
    if (isLoading) {
        return (
            <div className={cn(
                'bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4',
                className
            )}>
                <Skeleton className="w-11 h-11 rounded-xl" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className={cn(
                'bg-white border shadow-sm hover:shadow-md rounded-2xl p-5 relative overflow-hidden group cursor-default',
                iconTone ? iconTone.border : 'border-slate-200',
                className
            )}
        >
            {/* Hover glow */}
            <div
                className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none',
                    iconTone?.hoverBg ?? 'bg-violet-50/40'
                )}
            />

            {/* Icon */}
            <div
                className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative z-10 shadow-sm group-hover:shadow-md transition-shadow',
                    iconTone ? iconTone.bg : cn('bg-gradient-to-br', iconGradient)
                )}
            >
                <span className={cn(iconTone ? iconTone.text : 'text-white')}>{icon}</span>
            </div>

            {/* Value */}
            <div className="relative z-10">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                        {displayValue}
                    </span>
                    {unit && (
                        <span className="text-sm text-slate-500 font-medium">{unit}</span>
                    )}
                </div>

                <p className="text-sm text-slate-600 mt-1.5 font-medium">{label}</p>

                {/* Delta indicator */}
                {deltaValue !== undefined && (
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
                )}

                {/* Optional sub-note */}
                {note && (
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-snug">{note}</p>
                )}
            </div>
        </motion.div>
    );
}
