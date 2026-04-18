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
    { name: 'Công nghệ', value: 35, color: '#7c3aed' },
    { name: 'Tài chính', value: 20, color: '#a78bfa' },
    { name: 'Marketing', value: 15, color: '#f97316' },
    { name: 'Giáo dục', value: 12, color: '#fb923c' },
    { name: 'Khác', value: 18, color: '#c084fc' },
];

const revenueTrendData = [
    { day: 'Thứ 2', revenue: 45000000 },
    { day: 'Thứ 3', revenue: 52000000 },
    { day: 'Thứ 4', revenue: 48000000 },
    { day: 'Thứ 5', revenue: 61000000 },
    { day: 'Thứ 6', revenue: 55000000 },
    { day: 'Thứ 7', revenue: 42000000 },
    { day: 'Chủ nhật', revenue: 38000000 },
];

const violationStatusData = [
    { name: 'Lừa đảo', value: 45, color: '#ef4444' },
    { name: 'Spam', value: 30, color: '#f97316' },
    { name: 'Nội dung xấu', value: 25, color: '#7c3aed' },
];

export default function AdminDashboard() {
    const { data: adminStats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => dashboardService.getAdminStats().then(r => r.data),
    });

    const kpiData = adminStats ? [
        { label: 'Doanh thu', value: `${(Number(adminStats.revenue?.total ?? 0) / 1_000_000).toFixed(1)}M`, delta: `+12%`, deltaType: 'up' as const, icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600', period: '30 ngày' },
        { label: 'Vi phạm', value: '12', delta: '3 nghiêm trọng', deltaType: 'down' as const, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', period: 'chờ xử lý' },
        { label: 'Tin tuyển dụng', value: adminStats.jobs?.total?.toLocaleString() ?? '0', delta: `${adminStats.jobs?.active ?? 0} active`, deltaType: 'up' as const, icon: Briefcase, gradient: 'from-violet-500 to-violet-600', period: 'đang hiển thị' },
        { label: 'Người dùng', value: adminStats.users?.total?.toLocaleString() ?? '0', delta: `+${adminStats.users?.new_30d ?? 0}`, deltaType: 'up' as const, icon: Users, gradient: 'from-blue-500 to-blue-600', period: 'mới' },
    ] : [];
    return (
        <div className="p-6 lg:p-8 space-y-8 w-full flex-1">
            {/* Welcome */}
            <motion.div {...fadeUp(0)}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống JOBIO</p>
                    </div>
                    <Badge className="bg-violet-50 text-violet-700 border border-violet-200 font-semibold px-3 py-1.5">
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
                                <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 transition-all hover:border-violet-300 hover:shadow-md duration-300 group">
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
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Tăng trưởng</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Users & Việc làm theo tháng</p>
                        </div>
                        <div className="flex gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> Users</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> Việc làm</span>
                        </div>
                    </div>
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
                </div>

                {/* Industry Pie Chart */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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

            {/* Monitoring & Compliance Row */}
            <motion.div {...fadeUp(0.24)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Financial Trend */}
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-base text-slate-900">Doanh thu theo tuần</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Biểu đồ tăng trưởng tài chính thực tế</p>
                        </div>
                        <Link to="/admin/financial">
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                Chi tiết tài chính
                            </Button>
                        </Link>
                    </div>
                    <div className="h-[200px] w-full bg-slate-50/50 rounded-xl flex items-end justify-between px-4 pb-2 gap-2 border border-slate-100">
                        {revenueTrendData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div 
                                    className="w-full bg-emerald-500/80 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-600"
                                    style={{ height: `${(d.revenue / 70000000) * 100}%` }}
                                />
                                <span className="text-[10px] font-bold text-slate-400">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Violation Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-slate-900">Loại vi phạm</h3>
                        <Link to="/admin/reports">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </Link>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie data={violationStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                {violationStatusData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                        {violationStatusData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-slate-600 font-medium">{item.name}</span>
                                </div>
                                <span className="font-bold text-slate-900">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions Row */}
            <motion.div {...fadeUp(0.32)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Company Verifications */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
                    <p className="text-sm text-slate-400 text-center py-4">Xem danh sách cần duyệt trong trang Moderation</p>
                </div>

                {/* Pending Reviews */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <Star className="w-5 h-5 text-orange-500" />
                            Đánh giá chờ duyệt
                        </h3>
                        <Link to="/admin/moderation">
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50">
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
