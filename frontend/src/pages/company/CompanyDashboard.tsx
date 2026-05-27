import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, Users, Eye, CalendarClock, PlusSquare, Search, User2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardKpiCard } from '@/components/shared/DashboardKpiCard';
import { ApplicationsChart } from '@/components/company/ApplicationsChart';
import { RecentApplicationsTable } from '@/components/company/RecentApplicationsTable';
import { UpcomingInterviewsCard } from '@/components/company/UpcomingInterviewsCard';
import { useUserStore } from '@/store/userStore';
import { companyService } from '@/services/companyService';
import { billingService } from '@/services/billingService';
import { SubscriptionStatus } from '@/components/company/billing/SubscriptionStatus';


// Greeting based on time of day
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 17) return 'Chào buổi chiều';
    return 'Chào buổi tối';
}

// Helper: fade-up animation props for each section
const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

/** Quick action button inside welcome card */
function QuickAction({ icon, label, to, gradient }: { icon: React.ReactNode; label: string; to: string; gradient: string }) {
    return (
        <Link to={to}>
            <motion.div
                whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-100 hover:shadow-md cursor-pointer transition-all group min-w-[80px]"
            >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                    {icon}
                </div>
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors text-center leading-tight">{label}</span>
            </motion.div>
        </Link>
    );
}

export default function CompanyDashboard() {
    const { user } = useUserStore();
    const companyName = user?.full_name ?? 'Nhà tuyển dụng';

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['company', 'stats'],
        queryFn: () => companyService.getStats().then(r => r.data),
        staleTime: 60_000,
    });

    const kpiCards = [
        {
            icon: <Briefcase className="w-5 h-5" />,
            label: 'Tin đang tuyển',
            value: stats?.active_jobs,
            deltaValue: stats?.active_jobs_delta,
            iconTone: {
                bg: 'bg-cyan-50',
                text: 'text-cyan-600',
                border: 'border-cyan-200',
                hoverBg: 'bg-cyan-50/40',
            },
        },
        {
            icon: <Users className="w-5 h-5" />,
            label: 'Lượt ứng tuyển mới',
            value: stats?.new_applications,
            deltaValue: stats?.new_applications_delta,
            iconTone: {
                bg: 'bg-violet-50',
                text: 'text-violet-600',
                border: 'border-violet-200',
                hoverBg: 'bg-violet-50/40',
            },
        },
        {
            icon: <Eye className="w-5 h-5" />,
            label: 'Lượt xem tin',
            value: stats?.job_views,
            deltaValue: stats?.job_views_delta,
            iconTone: {
                bg: 'bg-rose-50',
                text: 'text-rose-600',
                border: 'border-rose-200',
                hoverBg: 'bg-rose-50/40',
            },
        },
        {
            icon: <CalendarClock className="w-5 h-5" />,
            label: 'Phỏng vấn sắp tới',
            value: stats?.upcoming_interviews,
            deltaValue: stats?.upcoming_interviews_delta,
            iconTone: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-200',
                hoverBg: 'bg-emerald-50/40',
            },
        },
    ];

    const quickActions = [
        { icon: <PlusSquare className="w-6 h-6" />, label: 'Đăng tin mới', to: '/company/jobs/create', gradient: 'from-violet-500 to-indigo-600' },
        { icon: <Search className="w-6 h-6" />, label: 'Tìm CV', to: '/company/cv-search', gradient: 'from-indigo-500 to-violet-600' },
        { icon: <User2 className="w-6 h-6" />, label: 'Xem ứng viên', to: '/company/candidates', gradient: 'from-violet-400 to-indigo-500' },
    ];

    const { data: currentSubscription } = useQuery({
        queryKey: ['billing', 'current-subscription'],
        queryFn: () => billingService.getCurrentSubscription().then(r => r.data),
    });

    return (
        <div className="p-6 lg:p-8 space-y-8 w-full mx-auto flex-1">
            {/* ── Welcome Card ───────────────────────────── */}
            <motion.div {...fadeUp(0)}>
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200 p-8 lg:p-10">
                    {/* Subtle professional background shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <p className="text-sm text-slate-500 mb-1 font-medium">{getGreeting()},</p>
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                                {companyName} 👋
                            </h1>
                            <p className="text-sm text-slate-500 mt-2 capitalize">{dateStr}</p>
                        </div>
                        <div className="flex gap-3 shrink-0 flex-wrap">
                            {quickActions.map((qa) => (
                                <QuickAction key={qa.to} {...qa} />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── KPI Stats ──────────────────────────────── */}
            <motion.div {...fadeUp(0.1)}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card) => (
                        <DashboardKpiCard key={card.label} {...card} isLoading={statsLoading} />
                    ))}
                </div>
            </motion.div>

            {/* ── Main Content: Chart & Quick Actions ───────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
                <motion.div {...fadeUp(0.18)} className="xl:col-span-3 h-full">
                    <ApplicationsChart />
                </motion.div>

                <motion.div {...fadeUp(0.22)} className="xl:col-span-1 h-full">
                    <div className="bg-white rounded-3xl p-8 flex flex-col gap-6 border border-slate-200 shadow-sm h-full">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Thao tác nhanh</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Lối tắt tác vụ quan trọng</p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            {[
                                { label: '📋 Đăng tin mới', to: '/company/jobs/create', desc: 'Tạo tin ngay' },
                                { label: '🔍 Tìm CV', to: '/company/cv-search', desc: 'Khám phá hồ sơ' },
                                { label: '👥 Xem ứng viên', to: '/company/candidates', desc: 'Quản lý danh sách' },
                                { label: '📊 Báo cáo', to: '/company/analytics', desc: 'Phân tích hiệu quả' },
                                { label: '⚙️ Cài đặt', to: '/company/settings', desc: 'Tùy chỉnh' },
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-800 group-hover:text-violet-600 transition-colors uppercase tracking-widest truncate">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate">{item.desc}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm border border-slate-100 text-violet-600 shrink-0 ml-2">
                                        <PlusSquare className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-4 py-3 px-3 bg-violet-50 rounded-xl border border-violet-100">
                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1 text-center font-bold">Nâng cấp Pro</p>
                            <p className="text-[9px] text-violet-400 text-center font-bold leading-relaxed">Mở khóa tính năng cao cấp</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Secondary Content: Interviews & Widgets ───────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
                <motion.div {...fadeUp(0.26)} className="xl:col-span-3 h-full">
                    <UpcomingInterviewsCard />
                </motion.div>

                <motion.div {...fadeUp(0.3)} className="xl:col-span-1 flex flex-col h-full">
                    {currentSubscription && (
                        <div className="shrink-0 flex-none">
                            <SubscriptionStatus subscription={currentSubscription} />
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Recent Applications ─────────────────────── */}
            <motion.div {...fadeUp(0.3)}>
                <RecentApplicationsTable />
            </motion.div>
        </div>
    );
}
