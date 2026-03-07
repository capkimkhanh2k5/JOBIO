import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | undefined;
    deltaValue?: number;
    unit?: string;
    iconGradient?: string;
    formattedValue?: string;
    isLoading?: boolean;
}

export function KpiCard({
    icon, label, value, deltaValue, unit, iconGradient = 'from-cyan-500 to-violet-500',
    formattedValue, isLoading
}: KpiCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 space-y-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
            </div>
        );
    }

    const displayValue = formattedValue ?? (value !== undefined ? value.toLocaleString('vi-VN') : '—');
    const trend = deltaValue === undefined ? null : deltaValue > 0 ? 'up' : deltaValue < 0 ? 'down' : 'flat';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-2xl p-5 relative overflow-hidden group cursor-default"
        >
            {/* Hover glow */}
            <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

            {/* Icon */}
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center mb-4 relative z-10 shadow-sm group-hover:shadow-md transition-shadow`}>
                <span className="text-white">{icon}</span>
            </div>

            {/* Value */}
            <div className="relative z-10">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{displayValue}</span>
                    {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
                </div>

                <p className="text-sm text-slate-600 mt-1 font-medium">{label}</p>

                {/* Delta indicator */}
                {deltaValue !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit' : trend === 'down' ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md w-fit' : 'text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md w-fit'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        <span>
                            {deltaValue > 0 ? '+' : ''}{deltaValue}{typeof deltaValue === 'number' && !Number.isInteger(deltaValue) ? '%' : ''} so với tuần trước
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
