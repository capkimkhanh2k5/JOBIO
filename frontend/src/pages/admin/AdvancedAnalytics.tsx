import { motion } from 'framer-motion';
import {
    BarChart3, Users, Briefcase, FileCheck, CalendarCheck,
    TrendingUp, Eye, Bookmark, Loader2, Trophy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, FunnelChart, Funnel, LabelList,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

export default function AdvancedAnalytics() {
    // ── Fetch all analytics data ──────────────────────────────────────────
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

    const { data: userGrowth = [] } = useQuery({
        queryKey: ['analytics-user-growth'],
        queryFn: () => dashboardService.getUserGrowth(12).then(r => r.data),
        staleTime: 300_000,
    });

    const { data: industryData = [] } = useQuery({
        queryKey: ['analytics-industry'],
        queryFn: () => dashboardService.getIndustryDistribution().then(r => r.data),
        staleTime: 300_000,
    });

    // ── KPI cards ──────────────────────────────────────────────────────────
    const kpis = [
        { label: 'Tổng ứng viên', value: overview?.users?.by_role?.candidate ?? 0, icon: Users, color: 'from-blue-500 to-blue-600' },
        { label: 'Nhà tuyển dụng', value: overview?.users?.by_role?.company ?? 0, icon: Briefcase, color: 'from-violet-500 to-violet-600' },
        { label: 'Đơn ứng tuyển', value: overview?.applications?.total ?? 0, icon: FileCheck, color: 'from-orange-500 to-orange-600' },
        { label: 'Phỏng vấn', value: overview?.interviews?.total ?? 0, icon: CalendarCheck, color: 'from-emerald-500 to-emerald-600' },
    ];

    const funnel: any[] = appStats?.funnel ?? [];
    const statusBreakdown: any[] = appStats?.status_breakdown ?? [];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-violet-600" />
                    Phân tích nâng cao
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Dữ liệu thực từ database — cập nhật theo thời gian thực</p>
            </motion.div>

            {/* KPI Cards */}
            <motion.div {...fadeUp(0.06)}>
                {loadingOverview ? (
                    <div className="py-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpis.map((k) => {
                            const Icon = k.icon;
                            return (
                                <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-white mb-4 shadow-sm`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{k.label}</p>
                                    <h3 className="text-2xl font-black text-slate-900 mt-1">{k.value.toLocaleString('vi-VN')}</h3>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Application Funnel + Status Breakdown */}
            <motion.div {...fadeUp(0.12)} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recruitment Funnel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Phễu tuyển dụng</h3>
                    <p className="text-xs text-slate-500 mb-5">Từ ứng tuyển đến nhận việc</p>
                    {loadingAppStats ? (
                        <div className="h-[250px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
                    ) : funnel.length > 0 ? (
                        <div className="space-y-3">
                            {funnel.map((stage: any, i: number) => {
                                const max = funnel[0]?.count || 1;
                                const pct = Math.round((stage.count / max) * 100);
                                return (
                                    <div key={stage.stage}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-700">{stage.stage}</span>
                                            <span className="text-xs font-black text-slate-900">{stage.count.toLocaleString('vi-VN')}</span>
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
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm font-medium">Chưa có dữ liệu</div>
                    )}
                </div>

                {/* Application Status Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Phân bổ trạng thái đơn</h3>
                    <p className="text-xs text-slate-500 mb-5">Tỷ lệ theo từng giai đoạn</p>
                    {loadingAppStats ? (
                        <div className="h-[250px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
                    ) : statusBreakdown.length > 0 ? (
                        <div className="flex gap-4 items-center">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="count">
                                        {statusBreakdown.map((entry: any) => (
                                            <Cell key={entry.status} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any, n: any, p: any) => [v.toLocaleString('vi-VN'), p.payload.label]} />
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
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm font-medium">Chưa có dữ liệu</div>
                    )}
                </div>
            </motion.div>

            {/* User Growth 12 months + Industry Distribution */}
            <motion.div {...fadeUp(0.18)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Tăng trưởng 12 tháng</h3>
                    <p className="text-xs text-slate-500 mb-5">Users đăng ký và việc làm mới</p>
                    {userGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                <Line type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} name="Users" />
                                <Line type="monotone" dataKey="jobs" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} name="Việc làm" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[240px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Ngành nghề</h3>
                    <p className="text-xs text-slate-500 mb-4">Phân bổ công ty</p>
                    {industryData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie data={industryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                                        {industryData.map((e: any) => <Cell key={e.name} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => [`${v}%`]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-3">
                                {industryData.slice(0, 5).map((item: any) => (
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
                    ) : (
                        <div className="h-[220px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
                    )}
                </div>
            </motion.div>

            {/* Top Jobs */}
            <motion.div {...fadeUp(0.24)}>
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
                    {loadingTopJobs ? (
                        <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>
                    ) : (topJobs as any[]).length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm font-medium">Chưa có dữ liệu job views</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Việc làm</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Công ty</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">
                                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Lượt xem</span>
                                        </th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">
                                            <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> Đã lưu</span>
                                        </th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Đơn UTV</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(topJobs as any[]).map((job: any, idx: number) => (
                                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-900 text-xs">{job.title}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-xs">{job.company}</td>
                                            <td className="py-4 px-6 font-black text-violet-600">{(job.views ?? 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-4 px-6 font-bold text-slate-700">{(job.saves ?? 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-4 px-6 font-bold text-slate-700">{(job.applications ?? 0).toLocaleString('vi-VN')}</td>
                                            <td className="py-4 px-6">
                                                <Badge className={`text-[10px] font-bold border ${job.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    {job.status}
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

            {/* Interview Stats */}
            {appStats?.interviews && (
                <motion.div {...fadeUp(0.3)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Tổng phỏng vấn', value: appStats.interviews.total, color: 'bg-violet-50 text-violet-700 border-violet-200' },
                        { label: 'Đã lên lịch', value: appStats.interviews.scheduled, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { label: 'Hoàn thành', value: appStats.interviews.completed, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-2xl border p-5 ${stat.color}`}>
                            <p className="text-xs font-black uppercase tracking-wider opacity-70">{stat.label}</p>
                            <h3 className="text-3xl font-black mt-1">{(stat.value ?? 0).toLocaleString('vi-VN')}</h3>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
