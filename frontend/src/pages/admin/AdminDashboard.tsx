import { motion } from 'framer-motion';
import {
    Users, Briefcase, Building2, FileCheck, TrendingUp,
    TrendingDown, ArrowRight, ShieldCheck, Star, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

/* ── Mock Data ── */
const kpiData = [
    { label: 'Tổng Users', value: '12,847', delta: '+124', deltaType: 'up', icon: Users, gradient: 'from-cyan-500 to-sky-600', period: 'tuần này' },
    { label: 'Tổng Việc Làm', value: '3,291', delta: '+38', deltaType: 'up', icon: Briefcase, gradient: 'from-violet-500 to-purple-600', period: 'tuần này' },
    { label: 'Tổng Công Ty', value: '689', delta: '+12', deltaType: 'up', icon: Building2, gradient: 'from-emerald-500 to-green-600', period: 'tuần này' },
    { label: 'Đơn Ứng Tuyển', value: '8,412', delta: '+287', deltaType: 'up', icon: FileCheck, gradient: 'from-pink-500 to-rose-600', period: 'tuần này' },
];

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

const pendingVerifications = [
    { id: 1, name: 'TechVN Solutions', industry: 'Công nghệ thông tin', date: '08/03/2026' },
    { id: 2, name: 'GreenFood Corp', industry: 'Thực phẩm', date: '07/03/2026' },
    { id: 3, name: 'EduStar Academy', industry: 'Giáo dục', date: '06/03/2026' },
];

const pendingReviews = [
    { id: 1, company: 'FPT Software', rating: 4, title: 'Môi trường tốt nhưng...', date: '09/03/2026' },
    { id: 2, company: 'Viettel', rating: 2, title: 'Cần cải thiện nhiều', date: '08/03/2026' },
];

export default function AdminDashboard() {
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
                        {pendingVerifications.length + pendingReviews.length} cần duyệt
                    </Badge>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div {...fadeUp(0.08)}>
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
                    <div className="space-y-3">
                        {pendingVerifications.map((company) => (
                            <div key={company.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {company.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{company.name}</p>
                                        <p className="text-xs text-slate-500">{company.industry} • {company.date}</p>
                                    </div>
                                </div>
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                    Chờ duyệt
                                </Badge>
                            </div>
                        ))}
                    </div>
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
                    <div className="space-y-3">
                        {pendingReviews.map((review) => (
                            <div key={review.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{review.title}</p>
                                    <p className="text-xs text-slate-500">{review.company} • {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} • {review.date}</p>
                                </div>
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                    Chờ duyệt
                                </Badge>
                            </div>
                        ))}
                        {pendingReviews.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">Không có đánh giá nào chờ duyệt</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
