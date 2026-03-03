import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from '@/services/dashboardService';

type ChartPeriod = 7 | 30 | 90;

const periods: { label: string; value: ChartPeriod }[] = [
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
    { label: '90 ngày', value: 90 },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-effect rounded-xl px-4 py-3 border border-white/10 shadow-2xl text-sm">
            <p className="font-semibold text-foreground mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted-foreground">{p.dataKey === 'applications' ? 'Ứng tuyển' : 'Lượt xem'}:</span>
                    <span className="font-semibold text-foreground">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export function ApplicationsChart() {
    const [period, setPeriod] = useState<ChartPeriod>(30);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['employer', 'chart', period],
        queryFn: () => dashboardService.getAnalyticsReports({ report_type: 'applications_chart' }).then(r => r.data),
        staleTime: 60_000,
        placeholderData: (prev) => prev,
    });

    // For 30/90 day views, reduce tick density
    const tickInterval = period === 7 ? 0 : period === 30 ? 4 : 14;

    return (
        <div className="glass-card rounded-2xl p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-lg">Biểu đồ ứng tuyển</h3>
                    <p className="text-sm text-muted-foreground">Theo dõi số lượng ứng tuyển và lượt xem theo thời gian</p>
                </div>
                {/* Period filter tabs */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
                    {periods.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${period === p.value
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-foreground border border-white/15'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <AnimatePresence mode="wait">
                {isLoading || isFetching && !data ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Skeleton className="w-full h-64 rounded-xl" />
                    </motion.div>
                ) : (
                    <motion.div
                        key={period}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isFetching ? 0.65 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="h-64"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={tickInterval}
                                />
                                <YAxis
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                <Legend
                                    formatter={(value) => value === 'applications' ? 'Ứng tuyển' : 'Lượt xem'}
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#gradViews)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#8b5cf6' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="applications"
                                    stroke="#22d3ee"
                                    strokeWidth={2}
                                    fill="url(#gradApps)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#22d3ee' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
