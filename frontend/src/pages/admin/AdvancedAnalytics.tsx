import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Users, Briefcase, FileCheck, CalendarCheck,
    Eye, Bookmark, Loader2, Trophy, DollarSign, AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import {
    PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const JOB_STATUS_LABEL: Record<string, string> = {
    published: 'Đã đăng', draft: 'Nháp', closed: 'Đã đóng', expired: 'Hết hạn',
};

const PERIOD_OPTIONS = [
    { label: '6 tháng', value: 6 },
    { label: '9 tháng', value: 9 },
    { label: '12 tháng', value: 12 },
];

const REVENUE_OPTIONS = [
    { label: '7 ngày', value: 7 },
    { label: '14 ngày', value: 14 },
    { label: '30 ngày', value: 30 },
];

function EmptyState({ text = 'Chưa có dữ liệu', height = 200 }: { text?: string; height?: number }) {
    return (
        <div style={{ height }} className="flex items-center justify-center text-slate-400 text-sm font-medium">
            {text}
        </div>
    );
}

function LoadingSpinner({ height = 200 }: { height?: number }) {
    return (
        <div style={{ height }} className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
    );
}

export default function AdvancedAnalytics() {
    const [growthMonths, setGrowthMonths] = useState(12);
    const [revenueDays, setRevenueDays] = useState(7);

    const { data: overview, isLoading: loadingOverview } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: () => dashboardService.getAnalyticsOverview().then(r => r.data),
        staleTime: 60_000,
    });

    const { data: appStats, isLoading: loadingAppStats } = useQuery({
        queryKey: ['analytics-app-stats'],
        queryFn: () => dashboardService.getApplicationStats().then(r => r.data),
        staleTime: 120_000,
    });

    const { data: topJobs = [], isLoading: loadingTopJobs } = useQuery({
        queryKey: ['analytics-top-jobs'],
        queryFn: () => dashboardService.getTopJobs(8).then(r => r.data),
        staleTime: 120_000,
    });

    const { data: userGrowth = [], isLoading: loadingGrowth } = useQuery({
        queryKey: ['analytics-user-growth', growthMonths],
        queryFn: () => dashboardService.getUserGrowth(growthMonths).then(r => r.data),
        staleTime: 300_000,
    });

    const { data: industryData = [], isLoading: loadingIndustry } = useQuery({
        queryKey: ['analytics-industry'],
        queryFn: () => dashboardService.getIndustryDistribution().then(r => r.data),
        staleTime: 300_000,
    });

    const { data: revenueTrend = [], isLoading: loadingRevenue } = useQuery({
        queryKey: ['analytics-revenue-trend', revenueDays],
        queryFn: () => dashboardService.getRevenueTrend(revenueDays).then(r => r.data),
        staleTime: 120_000,
    });

    const { data: violationData = [], isLoading: loadingViolation } = useQuery({
        queryKey: ['analytics-violation'],
        queryFn: () => dashboardService.getViolationBreakdown().then(r => r.data),
        staleTime: 300_000,
    });

    const kpis = [
        { label: 'Tổng ứng viên', value: overview?.users?.by_role?.candidate ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
        { label: 'Nhà tuyển dụng', value: overview?.users?.by_role?.company ?? 0, icon: Briefcase, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
        { label: 'Đơn ứng tuyển', value: overview?.applications?.total ?? 0, icon: FileCheck, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
        { label: 'Phỏng vấn', value: overview?.interviews?.total ?? 0, icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
        { label: 'Doanh thu (VND)', value: overview?.revenue?.total ?? 0, icon: DollarSign, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100', format: 'currency' },
        { label: 'Báo cáo vi phạm', value: overview?.reports?.pending ?? 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
    ];

    const funnel: any[] = appStats?.funnel ?? [];
    const statusBreakdown: any[] = appStats?.status_breakdown ?? [];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Phân tích nâng cao
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Dữ liệu thực từ database — cập nhật theo thời gian thực</p>
            </motion.div>

            {/* KPI Cards */}
            <motion.div {...fadeUp(0.06)}>
                {loadingOverview ? (
                    <LoadingSpinner height={100} />
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {kpis.map((k) => {
                            const Icon = k.icon;
                            const displayVal = k.format === 'currency'
                                ? k.value.toLocaleString('vi-VN') + '₫'
                                : k.value.toLocaleString('vi-VN');
                            return (
                                <div key={k.label} className={`bg-white rounded-2xl border ${k.border} shadow-sm p-4`}>
                                    <div className={`w-9 h-9 rounded-xl ${k.color} flex items-center justify-center mb-3`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{k.label}</p>
                                    <h3 className="text-xl font-black text-slate-900 mt-0.5 leading-tight">{displayVal}</h3>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* User Growth + Revenue Trend */}
            <motion.div {...fadeUp(0.12)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* User Growth */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Tăng trưởng người dùng & việc làm</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Đăng ký mới theo tháng</p>
                        </div>
                        <div className="flex gap-1">
                            {PERIOD_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setGrowthMonths(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${growthMonths === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {loadingGrowth ? <LoadingSpinner height={240} /> : userGrowth.length === 0 ? <EmptyState height={240} /> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} name="Users" />
                                <Line type="monotone" dataKey="jobs" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} name="Việc làm" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Industry Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Mô hình / Lĩnh vực CNTT</h3>
                    <p className="text-xs text-slate-500 mb-4">Phân bổ công ty theo lĩnh vực</p>
                    {loadingIndustry ? <LoadingSpinner height={220} /> : (industryData as any[]).length === 0 ? <EmptyState height={220} /> : (
                        <>
                            <ResponsiveContainer width="100%" height={130}>
                                <PieChart>
                                    <Pie data={industryData as any[]} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                                        {(industryData as any[]).map((e: any) => <Cell key={e.name} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => [`${v}%`]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-3">
                                {(industryData as any[]).slice(0, 5).map((item: any) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="text-slate-600 font-medium truncate">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-700">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Revenue Trend + Application Funnel */}
            <motion.div {...fadeUp(0.18)} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Doanh thu</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Theo ngày (VND)</p>
                        </div>
                        <div className="flex gap-1">
                            {REVENUE_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setRevenueDays(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${revenueDays === opt.value ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {loadingRevenue ? <LoadingSpinner height={220} /> : (revenueTrend as any[]).length === 0 ? <EmptyState height={220} /> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={revenueTrend as any[]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    formatter={(v: any) => [Number(v).toLocaleString('vi-VN') + '₫', 'Doanh thu']} />
                                <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Doanh thu" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Application Funnel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Phễu tuyển dụng</h3>
                    <p className="text-xs text-slate-500 mb-5">Từ ứng tuyển đến nhận việc</p>
                    {loadingAppStats ? <LoadingSpinner height={220} /> : funnel.length === 0 ? <EmptyState height={220} /> : (
                        <div className="space-y-3">
                            {funnel.map((stage: any, i: number) => {
                                const max = funnel[0]?.count || 1;
                                const pct = Math.round((stage.count / max) * 100);
                                return (
                                    <div key={stage.stage}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-700">{stage.stage}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">{pct}%</span>
                                                <span className="text-xs font-black text-slate-900">{stage.count.toLocaleString('vi-VN')}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.1 * i, duration: 0.6, ease: 'easeOut' }}
                                                className="h-3 rounded-full"
                                                style={{ backgroundColor: stage.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Application Status + Violation Breakdown */}
            <motion.div {...fadeUp(0.24)} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Phân bổ trạng thái đơn</h3>
                    <p className="text-xs text-slate-500 mb-5">Tỷ lệ theo từng giai đoạn</p>
                    {loadingAppStats ? <LoadingSpinner height={200} /> : statusBreakdown.length === 0 ? <EmptyState height={200} /> : (
                        <div className="flex gap-4 items-center">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="count">
                                        {statusBreakdown.map((entry: any) => <Cell key={entry.status} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any, _: any, p: any) => [v.toLocaleString('vi-VN'), p.payload.label]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {statusBreakdown.map((s: any) => (
                                    <div key={s.status} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                            <span className="text-slate-600 font-medium">{s.label}</span>
                                        </div>
                                        <span className="font-black text-slate-900">{s.count.toLocaleString('vi-VN')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Violation Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Vi phạm theo loại</h3>
                    <p className="text-xs text-slate-500 mb-5">Phân loại báo cáo vi phạm</p>
                    {loadingViolation ? <LoadingSpinner height={200} /> : (violationData as any[]).length === 0 ? (
                        <EmptyState height={200} text="Chưa có báo cáo vi phạm nào" />
                    ) : (
                        <div className="flex gap-4 items-center">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie data={violationData as any[]} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="count">
                                        {(violationData as any[]).map((e: any) => <Cell key={e.name} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any, _: any, p: any) => [v, p.payload.name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {(violationData as any[]).map((s: any) => (
                                    <div key={s.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                            <span className="text-slate-600 font-medium truncate">{s.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900">{s.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Interview Stats */}
            {appStats?.interviews && (
                <motion.div {...fadeUp(0.30)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng phỏng vấn', value: appStats.interviews.total, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                        { label: 'Đã lên lịch', value: appStats.interviews.scheduled, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                        { label: 'Hoàn thành', value: appStats.interviews.completed, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                        { label: 'Đã huỷ', value: appStats.interviews.cancelled, color: 'bg-red-50 text-red-700 border-red-100' },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-2xl border p-5 ${stat.color}`}>
                            <p className="text-xs font-black uppercase tracking-wider opacity-70">{stat.label}</p>
                            <h3 className="text-3xl font-black mt-1">{(stat.value ?? 0).toLocaleString('vi-VN')}</h3>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Top Jobs */}
            <motion.div {...fadeUp(0.36)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100/50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900">Top việc làm được quan tâm</h3>
                            <p className="text-xs text-slate-500">Xếp hạng theo lượt xem thực tế</p>
                        </div>
                    </div>
                    {loadingTopJobs ? <LoadingSpinner height={120} /> : (topJobs as any[]).length === 0 ? (
                        <EmptyState height={120} text="Chưa có dữ liệu job views" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Việc làm</th>
                                        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Công ty</th>
                                        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500"><span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Lượt xem</span></th>
                                        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500"><span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> Đã lưu</span></th>
                                        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Đơn UTV</th>
                                        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(topJobs as any[]).map((job: any, idx: number) => (
                                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>{idx + 1}</span>
                                                    <span className="font-bold text-slate-900 text-xs">{job.title}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-slate-500 text-xs">{job.company}</td>
                                            <td className="py-3 px-6 font-black text-blue-600">{(job.views ?? 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-3 px-6 font-bold text-slate-700">{(job.saves ?? 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-3 px-6 font-bold text-slate-700">{(job.applications ?? 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-3 px-6">
                                                <Badge className={`text-[10px] font-bold border ${job.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    {JOB_STATUS_LABEL[job.status] ?? job.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
