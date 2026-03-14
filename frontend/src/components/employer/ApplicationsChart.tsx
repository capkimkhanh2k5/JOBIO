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
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-xl text-sm">
            <p className="font-bold text-slate-900 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-500 font-medium">{p.dataKey === 'applications' ? 'Ứng tuyển' : 'Lượt xem'}:</span>
                    <span className="font-bold text-slate-900">{p.value}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Biểu đồ ứng tuyển</h3>
                    <p className="text-sm text-slate-500 font-medium">Theo dõi số lượng ứng tuyển và lượt xem theo thời gian</p>
                </div>
                {/* Period filter tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    {periods.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${period === p.value
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
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
                        className="flex-1 min-h-[300px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={tickInterval}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
                                <Legend
                                    formatter={(value) => value === 'applications' ? 'Ứng tuyển' : 'Lượt xem'}
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '12px', fontWeight: 600, color: '#334155' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="url(#gradViews)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="applications"
                                    stroke="#2563EB"
                                    strokeWidth={3}
                                    fill="url(#gradApps)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
