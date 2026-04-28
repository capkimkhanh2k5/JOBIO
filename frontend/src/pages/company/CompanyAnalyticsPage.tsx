import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer,
    AreaChart, Area,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
    Briefcase, Users, Eye, UserCheck, TrendingUp, TrendingDown, Minus,
    BarChart3, RefreshCw, CalendarDays, Target, Percent,
    ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/services/analyticsService';
import type { TimeSeriesPoint, FunnelStage, StatusBreakdown, TopJob } from '@/services/analyticsService';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';

// ─── animation helper ─────────────────────────────────────────────────────────
const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

// ─── Period filter ────────────────────────────────────────────────────────────
type Period = 7 | 30 | 90;
const PERIODS: { label: string; value: Period }[] = [
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
    { label: '90 ngày', value: 90 },
];

// ─── Job status badge config ──────────────────────────────────────────────────
const JOB_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    published: { label: 'Đang tuyển', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    draft: { label: 'Nháp', className: 'bg-slate-50 text-slate-600 border-slate-200' },
    closed: { label: 'Đã đóng', className: 'bg-red-50 text-red-600 border-red-200' },
    expired: { label: 'Hết hạn', className: 'bg-amber-50 text-amber-600 border-amber-200' },
};

// ─── KPI Card (summary) ───────────────────────────────────────────────────────
function SummaryKpiCard({
    icon, label, value, delta, unit, iconGradient, isLoading, note,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string | undefined;
    delta?: number;
    unit?: string;
    iconGradient: string;
    isLoading?: boolean;
    note?: string;
}) {
    if (isLoading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-5 space-y-4">
                <Skeleton className="w-11 h-11 rounded-xl" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
            </div>
        );
    }

    const trend = delta === undefined ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm hover:shadow-md rounded-3xl p-5 relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-violet-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                <span className="text-white">{icon}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{value ?? '—'}</span>
                {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">{label}</p>
            {delta !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-semibold w-fit px-1.5 py-0.5 rounded-md ${
                    trend === 'up' ? 'text-emerald-600 bg-emerald-50' :
                    trend === 'down' ? 'text-red-600 bg-red-50' :
                    'text-slate-500 bg-slate-50'
                }`}>
                    {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> :
                     trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> :
                     <Minus className="w-3.5 h-3.5" />}
                    <span>{delta > 0 ? '+' : ''}{delta}% so với tháng trước</span>
                </div>
            )}
            {note && <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{note}</p>}
        </motion.div>
    );
}

// ─── Custom Tooltip for area chart ───────────────────────────────────────────
function AreaTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-xl text-sm">
            <p className="font-bold text-slate-900 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-500 font-medium">
                        {p.dataKey === 'applications' ? 'Ứng tuyển' : 'Lượt xem'}:
                    </span>
                    <span className="font-bold text-slate-900">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Custom Tooltip for pie ───────────────────────────────────────────────────
function PieTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-xl text-sm">
            <p className="font-bold text-slate-900 mb-1">{item.name}</p>
            <p className="text-slate-600 font-semibold">{item.value} hồ sơ</p>
        </div>
    );
}

// ─── Top Job Table Row ────────────────────────────────────────────────────────
function JobTableRow({ job, index }: { job: TopJob; index: number }) {
    const statusCfg = JOB_STATUS_CONFIG[job.status] ?? { label: job.status, className: 'bg-slate-50 text-slate-600' };
    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
        >
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-violet-50 text-violet-600 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                    </span>
                    <Link to={`/company/jobs/${job.id}`} className="font-semibold text-slate-800 hover:text-violet-600 transition-colors line-clamp-1 text-sm">
                        {job.title}
                    </Link>
                </div>
            </td>
            <td className="px-5 py-4">
                <Badge className={`text-[11px] font-bold border shadow-none ${statusCfg.className}`}>
                    {statusCfg.label}
                </Badge>
            </td>
            <td className="px-5 py-4 text-sm font-semibold text-slate-800 text-right">{job.views.toLocaleString('vi-VN')}</td>
            <td className="px-5 py-4 text-sm font-semibold text-slate-800 text-right">{job.applications}</td>
            <td className="px-5 py-4 text-sm font-semibold text-slate-800 text-right">{job.interviews}</td>
            <td className="px-5 py-4 text-sm font-semibold text-emerald-600 text-right">{job.hired}</td>
            <td className="px-5 py-4 text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    job.conversion_rate >= 50 ? 'bg-emerald-50 text-emerald-700' :
                    job.conversion_rate >= 20 ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                }`}>
                    {job.conversion_rate}%
                </span>
            </td>
        </motion.tr>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CompanyAnalyticsPage() {
    const [period, setPeriod] = useState<Period>(30);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['company', 'analytics'],
        queryFn: () => analyticsService.getCompanyAnalytics().then(r => r.data),
        staleTime: 2 * 60_000,
        retry: 1,
    });

    const summary = data?.summary;

    // Filter time-series by period
    const timeSeries: TimeSeriesPoint[] = data?.time_series?.slice(-period) ?? [];
    const tickInterval = period === 7 ? 0 : period === 30 ? 4 : 14;

    const statusBreakdown: StatusBreakdown[] = data?.status_breakdown ?? [];
    const pieData: StatusBreakdown[] = statusBreakdown.filter(s => s.count > 0);
    const statusTotal = statusBreakdown.reduce((s, x) => s + x.count, 0);

    // Funnel data
    const funnelData: FunnelStage[] = data?.funnel ?? [];

    // top jobs
    const topJobs: TopJob[] = data?.top_jobs ?? [];

    const kpiCards = [
        {
            icon: <Briefcase className="w-5 h-5" />,
            label: 'Tin đang tuyển',
            value: summary?.active_jobs,
            iconGradient: 'from-cyan-500 to-sky-600',
            note: `Tổng ${summary?.total_jobs ?? 0} tin tất cả`,
        },
        {
            icon: <Users className="w-5 h-5" />,
            label: 'Ứng tuyển mới (30 ngày)',
            value: summary?.new_applications_30d,
            delta: summary?.applications_delta,
            iconGradient: 'from-violet-500 to-purple-600',
        },
        {
            icon: <Eye className="w-5 h-5" />,
            label: 'Tổng lượt xem tin',
            value: summary?.total_views?.toLocaleString('vi-VN'),
            iconGradient: 'from-pink-500 to-rose-600',
        },
        {
            icon: <UserCheck className="w-5 h-5" />,
            label: 'Tuyển thành công',
            value: summary?.hired_count,
            iconGradient: 'from-emerald-500 to-teal-600',
            note: `${summary?.hire_rate ?? 0}% tỷ lệ tuyển dụng`,
        },
        {
            icon: <Target className="w-5 h-5" />,
            label: 'Tổng ứng tuyển',
            value: summary?.total_applications,
            iconGradient: 'from-amber-500 to-orange-500',
        },
        {
            icon: <CalendarDays className="w-5 h-5" />,
            label: 'Đang phỏng vấn',
            value: summary?.interview_count,
            iconGradient: 'from-indigo-500 to-violet-600',
        },
    ];

    return (
        <div className="w-full mx-auto min-h-screen">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Báo cáo & Phân tích"
                    description="Theo dõi hiệu quả tuyển dụng và đưa ra quyết định dựa trên dữ liệu"
                    icon={BarChart3}
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="gap-2 text-slate-600 border-slate-200 hover:border-violet-200 hover:text-violet-600 cursor-pointer h-10 rounded-xl px-4"
                            id="analytics-refresh-btn"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    }
                />
            </div>

            <div className="p-6 lg:p-8 space-y-8">
                {/* ── Error State ───────────────────────────────────────────── */}
                {isError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <p className="text-red-600 font-semibold mb-2">Không thể tải dữ liệu báo cáo</p>
                        <p className="text-red-400 text-sm mb-4">Vui lòng kiểm tra kết nối và thử lại</p>
                        <Button onClick={() => refetch()} variant="outline" size="sm" className="text-red-600 border-red-200 cursor-pointer">
                            Thử lại
                        </Button>
                    </div>
                )}

                {/* ── KPI Summary Cards ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0.05)}>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {kpiCards.map((card) => (
                            <SummaryKpiCard
                                key={card.label}
                                icon={card.icon}
                                label={card.label}
                                value={card.value}
                                delta={(card as any).delta}
                                iconGradient={card.iconGradient}
                                isLoading={isLoading}
                                note={(card as any).note}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* ── Time-Series Chart ─────────────────────────────────────── */}
                <motion.div {...fadeUp(0.12)}>
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="font-bold text-lg text-slate-900">Xu hướng theo thời gian</h2>
                                <p className="text-sm text-slate-500 font-medium mt-0.5">Số lượng ứng tuyển và lượt xem tin theo ngày</p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl w-fit">
                                {PERIODS.map((p) => (
                                    <button
                                        key={p.value}
                                        id={`period-btn-${p.value}`}
                                        onClick={() => setPeriod(p.value)}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                                            period === p.value
                                                ? 'bg-violet-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div key="skel-chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Skeleton className="w-full h-72 rounded-xl" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={period}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isFetching ? 0.6 : 1 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ height: 300 }}
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={timeSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradApps2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.22} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradViews2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.18} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
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
                                            <Tooltip content={<AreaTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
                                            <Legend
                                                formatter={(v) => v === 'applications' ? 'Ứng tuyển' : 'Lượt xem'}
                                                wrapperStyle={{ fontSize: '12px', paddingTop: '12px', fontWeight: 600, color: '#334155' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="views"
                                                stroke="#06b6d4"
                                                strokeWidth={2.5}
                                                fill="url(#gradViews2)"
                                                dot={false}
                                                activeDot={{ r: 5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="applications"
                                                stroke="#8b5cf6"
                                                strokeWidth={2.5}
                                                fill="url(#gradApps2)"
                                                dot={false}
                                                activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ── Funnel + Pie ──────────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Application Funnel */}
                    <motion.div {...fadeUp(0.18)}>
                        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 h-full">
                            <h2 className="font-bold text-lg text-slate-900 mb-1">Phễu tuyển dụng</h2>
                            <p className="text-sm text-slate-500 font-medium mb-6">Ứng viên qua từng giai đoạn</p>

                            {isLoading ? (
                                <div className="space-y-3">
                                    {Array(6).fill(null).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                                </div>
                            ) : funnelData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Target className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Chưa có dữ liệu phễu</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {funnelData.map((stage, idx) => {
                                        const maxCount = funnelData[0]?.count || 1;
                                        const pct = Math.round((stage.count / maxCount) * 100);
                                        const isEmptyStage = pct === 0;
                                        return (
                                            <motion.div
                                                key={stage.stage}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.07 }}
                                                className="flex items-center gap-4 group"
                                            >
                                                <div className="w-28 text-xs font-semibold text-slate-600 shrink-0 text-right">{stage.stage}</div>
                                                <div className="flex-1 relative h-9 bg-slate-100 rounded-lg overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.7, delay: idx * 0.1, ease: 'easeOut' }}
                                                        className="absolute inset-y-0 left-0 rounded-lg"
                                                        style={{ background: stage.color }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center px-3">
                                                        <span className={`text-xs font-bold z-10 ${isEmptyStage ? 'text-slate-600' : 'text-white drop-shadow-sm'}`}>
                                                            {stage.count} {pct < 100 && <span className="opacity-75 font-normal">({pct}%)</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Status Pie Chart */}
                    <motion.div {...fadeUp(0.22)}>
                        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 h-full">
                            <h2 className="font-bold text-lg text-slate-900 mb-1">Phân bổ trạng thái</h2>
                            <p className="text-sm text-slate-500 font-medium mb-4">Tỷ lệ hồ sơ theo từng trạng thái</p>

                            {isLoading ? (
                                <div className="flex items-center justify-center h-56">
                                    <Skeleton className="w-48 h-48 rounded-full" />
                                </div>
                            ) : pieData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Percent className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Chưa có dữ liệu ứng tuyển</p>
                                </div>
                            ) : (
                                <div className="flex flex-col lg:flex-row items-center gap-6">
                                    <div style={{ width: 200, height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={55} outerRadius={90}
                                                    dataKey="count"
                                                    nameKey="label"
                                                    stroke="none"
                                                    paddingAngle={2}
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<PieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                        {statusBreakdown.map((item) => {
                                            const pct = statusTotal > 0 ? Math.round((item.count / statusTotal) * 100) : 0;
                                            return (
                                                <div key={item.status} className={`flex items-center gap-2 ${item.count === 0 ? 'opacity-60' : ''}`}>
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                                                    <span className="text-xs font-medium text-slate-600 flex-1">{item.label}</span>
                                                    <span className="text-xs font-bold text-slate-800">{item.count}</span>
                                                    <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* ── Top Jobs Table ────────────────────────────────────────── */}
                <motion.div {...fadeUp(0.28)}>
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h2 className="font-bold text-lg text-slate-900">Hiệu quả từng tin tuyển dụng</h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Top 10 tin theo số lượng ứng tuyển</p>
                            </div>
                            <Link
                                to="/company/manage-jobs"
                                className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                                id="analytics-view-all-jobs-link"
                            >
                                Tất cả tin <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full" role="table" aria-label="Bảng hiệu quả tuyển dụng">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60">
                                        {['Vị trí', 'Trạng thái', 'Lượt xem', 'Ứng tuyển', 'Phỏng vấn', 'Tuyển được', 'Tỷ lệ'].map((col) => (
                                            <th
                                                key={col}
                                                className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap ${
                                                    ['Lượt xem', 'Ứng tuyển', 'Phỏng vấn', 'Tuyển được', 'Tỷ lệ'].includes(col) ? 'text-right' : 'text-left'
                                                }`}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading
                                        ? Array(5).fill(null).map((_, i) => (
                                            <tr key={i} className="border-b border-slate-100">
                                                {Array(7).fill(null).map((__, j) => (
                                                    <td key={j} className="px-5 py-4">
                                                        <Skeleton className="h-5 w-full max-w-[100px]" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                        : topJobs.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-12 text-center">
                                                    <div className="flex flex-col items-center text-slate-400">
                                                        <Briefcase className="w-10 h-10 mb-3 opacity-30" />
                                                        <p className="text-sm font-medium">Chưa có tin tuyển dụng nào</p>
                                                        <Link to="/company/jobs/create" className="mt-3 text-violet-600 text-sm font-semibold hover:underline" id="analytics-post-job-link">
                                                            Đăng tin ngay →
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                        : topJobs.map((job, i) => (
                                            <JobTableRow key={job.id} job={job} index={i} />
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* ── Quick Insight Cards ───────────────────────────────────── */}
                {!isLoading && data && (
                    <motion.div {...fadeUp(0.35)}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                {
                                    title: 'Tỷ lệ chuyển đổi tổng',
                                    value: `${summary?.hire_rate ?? 0}%`,
                                    desc: 'Từ ứng tuyển → tuyển dụng thành công',
                                    color: 'from-emerald-500 to-teal-600',
                                    icon: <TrendingUp className="w-5 h-5" />,
                                },
                                {
                                    title: 'Phỏng vấn đang diễn ra',
                                    value: summary?.interview_count ?? 0,
                                    desc: 'Ứng viên đang ở vòng phỏng vấn',
                                    color: 'from-violet-500 to-indigo-600',
                                    icon: <CalendarDays className="w-5 h-5" />,
                                },
                                {
                                    title: 'Tổng ứng viên tiếp cận',
                                    value: (summary?.total_applications ?? 0).toLocaleString('vi-VN'),
                                    desc: 'Hồ sơ nhận được từ trước đến nay',
                                    color: 'from-pink-500 to-rose-600',
                                    icon: <Users className="w-5 h-5" />,
                                },
                            ].map((card) => (
                                <div key={card.title} className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-5 flex gap-4 items-start">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{card.title}</p>
                                        <p className="text-2xl font-black text-slate-900 mt-0.5">{card.value}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">{card.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
