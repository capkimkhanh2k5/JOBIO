import { motion } from 'framer-motion';
import {
    Users, Briefcase, Building2, FileCheck, TrendingUp,
    TrendingDown, ArrowRight, ShieldCheck, Star, AlertTriangle, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

/*
 * Chart placeholder data – The backend currently has NO time-series analytics endpoint
 * (user growth, industry distribution). Only aggregate counts are available via
 * GET /api/dashboard/stats/admin/. These visual placeholders should be replaced once
 * the backend implements dedicated chart endpoints (e.g. /api/analytics/user-growth/).
 */
const userGrowthData = [
    { month: 'T1', users: 8200, jobs: 2100 }, { month: 'T2', users: 9100, jobs: 2400 },
    { month: 'T3', users: 9800, jobs: 2600 }, { month: 'T4', users: 10500, jobs: 2800 },
    { month: 'T5', users: 11200, jobs: 2900 }, { month: 'T6', users: 11800, jobs: 3050 },
    { month: 'T7', users: 12847, jobs: 3291 },
];

const industryData = [
    { name: 'Công nghệ', value: 35, color: '#0ea5e9' },
    { name: 'Tài chính', value: 20, color: '#8b5cf6' },
    { name: 'Marketing', value: 15, color: '#f43f5e' },
    { name: 'Giáo dục', value: 12, color: '#10b981' },
    { name: 'Sản xuất', value: 10, color: '#f59e0b' },
    { name: 'Khác', value: 8, color: '#94a3b8' },
];

export default function AdminDashboard() {
    const { data: adminStats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => dashboardService.getAdminStats().then(r => r.data),
    });

    const kpiData = adminStats ? [
        { label: 'Tổng Users', value: adminStats.users?.total?.toLocaleString() ?? '0', delta: `+${adminStats.users?.new_30d ?? 0}`, deltaType: 'up' as const, icon: Users, gradient: 'from-cyan-500 to-sky-600', period: '30 ngày' },
        { label: 'Tổng Việc Làm', value: adminStats.jobs?.total?.toLocaleString() ?? '0', delta: `${adminStats.jobs?.active ?? 0} active`, deltaType: 'up' as const, icon: Briefcase, gradient: 'from-violet-500 to-purple-600', period: 'đang hoạt động' },
        { label: 'Doanh thu', value: `${(Number(adminStats.revenue?.total ?? 0) / 1_000_000).toFixed(1)}M`, delta: `+${(Number(adminStats.revenue?.revenue_30d ?? 0) / 1_000_000).toFixed(1)}M`, deltaType: 'up' as const, icon: Building2, gradient: 'from-emerald-500 to-green-600', period: '30 ngày' },
        { label: 'Đơn Ứng Tuyển', value: '-', delta: '', deltaType: 'up' as const, icon: FileCheck, gradient: 'from-pink-500 to-rose-600', period: '' },
    ] : [];
    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
            {/* Welcome */}
            <motion.div {...fadeUp(0)}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống JOBIO</p>
                    </div>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-3 py-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        Dashboard
                    </Badge>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div {...fadeUp(0.08)}>
                {loadingStats ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpiData.map((kpi) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center text-white shadow-sm`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold ${kpi.deltaType === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {kpi.deltaType === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                            {kpi.delta}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">{kpi.label} <span className="text-slate-400">• {kpi.period}</span></p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Charts Row */}
            <motion.div {...fadeUp(0.16)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* User Growth Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Tăng trưởng</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Users & Việc làm theo tháng</p>
                        </div>
                        <div className="flex gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Users</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Việc làm</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                            <Line type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4' }} />
                            <Line type="monotone" dataKey="jobs" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Industry Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-base text-slate-900 mb-1">Ngành nghề</h3>
                    <p className="text-xs text-slate-500 mb-4">Phân bổ theo ngành</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={industryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                                {industryData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                        {industryData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600 font-medium truncate">{item.name}</span>
                                <span className="text-slate-400 ml-auto">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions Row */}
            <motion.div {...fadeUp(0.24)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Company Verifications */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Duyệt công ty
                        </h3>
                        <Link to="/admin/moderation">
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <p className="text-sm text-slate-400 text-center py-4">Xem danh sách cần duyệt trong trang Moderation</p>
                </div>

                {/* Pending Reviews */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" />
                            Đánh giá chờ duyệt
                        </h3>
                        <Link to="/admin/moderation">
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <p className="text-sm text-slate-400 text-center py-4">Xem danh sách đánh giá cần duyệt trong trang Moderation</p>
                </div>
            </motion.div>
        </div>
    );
}
