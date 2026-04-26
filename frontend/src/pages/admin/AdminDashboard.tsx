import { motion } from 'framer-motion';
import {
    Users, Briefcase, TrendingUp,
    ArrowRight, ShieldCheck, AlertTriangle, Loader2,
    LayoutDashboard, FileCheck, CalendarCheck, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const formatVND = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
};

export default function AdminDashboard() {
    // ── Data fetching ─────────────────────────────────────────────────────
    const { data: overview, isLoading: loadingOverview } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: () => dashboardService.getAnalyticsOverview().then(r => r.data),
        staleTime: 60_000,
    });

    const { data: userGrowthData = [] } = useQuery({
        queryKey: ['analytics-user-growth'],
        queryFn: () => dashboardService.getUserGrowth(7).then(r => r.data),
        staleTime: 300_000,
    });

    const { data: industryData = [] } = useQuery({
        queryKey: ['analytics-industry'],
        queryFn: () => dashboardService.getIndustryDistribution().then(r => r.data),
        staleTime: 300_000,
    });

    const { data: revenueTrendData = [] } = useQuery({
        queryKey: ['analytics-revenue'],
        queryFn: () => dashboardService.getRevenueTrend(7).then(r => r.data),
        staleTime: 300_000,
    });

    const { data: violationData = [] } = useQuery({
        queryKey: ['analytics-violation'],
        queryFn: () => dashboardService.getViolationBreakdown().then(r => r.data),
        staleTime: 300_000,
    });

    // ── KPI cards ──────────────────────────────────────────────────────────
    const kpiData = overview ? [
        {
            label: 'Người dùng', period: `+${overview.users?.new_30d ?? 0} mới`,
            value: (overview.users?.total ?? 0).toLocaleString('vi-VN'),
            deltaType: 'up' as const, icon: Users, gradient: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Tin tuyển dụng', period: `${overview.jobs?.active ?? 0} active`,
            value: (overview.jobs?.total ?? 0).toLocaleString('vi-VN'),
            deltaType: 'up' as const, icon: Briefcase, gradient: 'from-violet-500 to-violet-600',
        },
        {
            label: 'Đơn ứng tuyển', period: `${overview.applications?.pending ?? 0} chờ xử lý`,
            value: (overview.applications?.total ?? 0).toLocaleString('vi-VN'),
            deltaType: 'up' as const, icon: FileCheck, gradient: 'from-orange-500 to-orange-600',
        },
        {
            label: 'Phỏng vấn', period: `${overview.interviews?.scheduled ?? 0} đã lên lịch`,
            value: (overview.interviews?.total ?? 0).toLocaleString('vi-VN'),
            deltaType: 'up' as const, icon: CalendarCheck, gradient: 'from-emerald-500 to-emerald-600',
        },
    ] : [];

    const revenueKPI = overview ? {
        total: overview.revenue?.total ?? 0,
        monthly: overview.revenue?.monthly ?? 0,
    } : null;

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Welcome */}
            <motion.div {...fadeUp(0)}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="w-8 h-8 text-violet-600" />
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống JOBIO — dữ liệu thực từ database</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-violet-50 text-violet-700 border border-violet-200 font-semibold px-3 py-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                            Live Data
                        </Badge>
                        <Link to="/admin/analytics">
                            <Button variant="outline" size="sm" className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 font-bold text-xs">
                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                Phân tích nâng cao
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div {...fadeUp(0.08)}>
                {loadingOverview ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpiData.map((kpi) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center text-white shadow-inner`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs font-bold text-emerald-600`}>
                                                <TrendingUp className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{kpi.label} <span className="normal-case font-medium text-[10px] text-slate-400">({kpi.period})</span></p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Revenue quick stat */}
            {revenueKPI && (
                <motion.div {...fadeUp(0.12)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Tổng doanh thu</p>
                            <h2 className="text-4xl font-black">{formatVND(revenueKPI.total)} VND</h2>
                            <p className="text-emerald-100 text-xs mt-1">Tổng giao dịch hoàn thành</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Doanh thu tháng này</p>
                            <h2 className="text-4xl font-black">{formatVND(revenueKPI.monthly)} VND</h2>
                            <p className="text-blue-100 text-xs mt-1">Tính từ đầu tháng đến nay</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Charts Row */}
            <motion.div {...fadeUp(0.16)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* User Growth Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Tăng trưởng</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Users & Việc làm theo tháng — dữ liệu thực</p>
                        </div>
                        <div className="flex gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> Users</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> Việc làm</span>
                        </div>
                    </div>
                    {userGrowthData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                <Line type="monotone" dataKey="users" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, fill: '#a78bfa' }} />
                                <Line type="monotone" dataKey="jobs" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                        </div>
                    )}
                </div>

                {/* Industry Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Mô hình / Lĩnh vực CNTT</h3>
                    <p className="text-xs text-slate-500 mb-4">Phân bổ công ty theo lĩnh vực</p>
                    {industryData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={industryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                        {industryData.map((entry: any) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: any) => [`${v}%`]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                                {industryData.slice(0, 6).map((item: any) => (
                                    <div key={item.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-slate-600 font-medium truncate">{item.name}</span>
                                        <span className="text-slate-400 ml-auto">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Monitoring & Compliance Row */}
            <motion.div {...fadeUp(0.24)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Financial Bar Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Doanh thu theo ngày</h3>
                            <p className="text-xs text-slate-500 mt-0.5">7 ngày gần nhất — dữ liệu thực</p>
                        </div>
                        <Link to="/admin/financial">
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                Chi tiết tài chính
                            </Button>
                        </Link>
                    </div>
                    {revenueTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={revenueTrendData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatVND(v)} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: any) => [`${(v / 1_000_000).toFixed(1)}M VND`, 'Doanh thu']} />
                                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                        </div>
                    )}
                </div>

                {/* Violation Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-slate-900">Loại vi phạm</h3>
                        <Link to="/admin/reports">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </Link>
                    </div>
                    {violationData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={130}>
                                <PieChart>
                                    <Pie data={violationData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                                        {violationData.map((entry: any) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => [`${v}%`]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-3">
                                {violationData.map((item: any) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-slate-600 font-medium">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-900">{item.count} <span className="text-slate-400 font-normal">({item.value}%)</span></span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-[180px] flex flex-col items-center justify-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            <p className="text-xs font-bold text-slate-500">Không có vi phạm</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Quick Actions Row */}
            <motion.div {...fadeUp(0.32)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Company Verifications */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-violet-600" />
                            Duyệt công ty
                        </h3>
                        <Link to="/admin/moderation">
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                                Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    {overview && (
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-black text-orange-600">{overview.companies?.pending_verification ?? 0}</div>
                                <div className="text-xs text-slate-500 mt-1">Chờ duyệt</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-slate-900">{overview.companies?.total ?? 0}</div>
                                <div className="text-xs text-slate-500 mt-1">Tổng công ty</div>
                            </div>
                        </div>
                    )}
                    {!overview && <p className="text-sm text-slate-400 text-center py-4">Xem danh sách cần duyệt trong trang Moderation</p>}
                </div>

                {/* Reports pending */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Báo cáo vi phạm
                        </h3>
                        <Link to="/admin/reports">
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                                Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    {overview && (
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-black text-red-600">{overview.reports?.pending ?? 0}</div>
                                <div className="text-xs text-slate-500 mt-1">Chờ xử lý</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-slate-900">{overview.reports?.total ?? 0}</div>
                                <div className="text-xs text-slate-500 mt-1">Tổng báo cáo</div>
                            </div>
                        </div>
                    )}
                    {!overview && <p className="text-sm text-slate-400 text-center py-4">Xem danh sách đánh giá cần duyệt trong trang Moderation</p>}
                </div>
            </motion.div>
        </div>
    );
}
