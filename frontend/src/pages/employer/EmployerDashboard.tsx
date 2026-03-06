import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, Users, Eye, CalendarClock, PlusSquare, Search, User2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/employer/KpiCard';
import { ApplicationsChart } from '@/components/employer/ApplicationsChart';
import { RecentApplicationsTable } from '@/components/employer/RecentApplicationsTable';
import { UpcomingInterviewsCard } from '@/components/employer/UpcomingInterviewsCard';
import { TopMatchesWidget } from '@/components/dashboard/TopMatchesWidget';
import { useUserStore } from '@/store/userStore';
import { employerService } from '@/services/employerService';

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
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card border border-white/8 hover:border-white/15 cursor-pointer transition-all group min-w-[80px]"
            >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                    {icon}
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{label}</span>
            </motion.div>
        </Link>
    );
}

export default function EmployerDashboard() {
    const { user } = useUserStore();
    const companyName = user?.full_name ?? 'Nhà tuyển dụng';

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['employer', 'stats'],
        queryFn: () => employerService.getStats().then(r => r.data),
        staleTime: 60_000,
    });

    const kpiCards = [
        {
            icon: <Briefcase className="w-5 h-5" />,
            label: 'Tin đang tuyển',
            value: stats?.active_jobs,
            deltaValue: stats?.active_jobs_delta,
            iconGradient: 'from-cyan-500 to-sky-600',
        },
        {
            icon: <Users className="w-5 h-5" />,
            label: 'Lượt ứng tuyển mới',
            value: stats?.new_applications,
            deltaValue: stats?.new_applications_delta,
            iconGradient: 'from-violet-500 to-purple-600',
        },
        {
            icon: <Eye className="w-5 h-5" />,
            label: 'Lượt xem tin',
            value: stats?.job_views,
            deltaValue: stats?.job_views_delta,
            iconGradient: 'from-pink-500 to-rose-600',
        },
        {
            icon: <CalendarClock className="w-5 h-5" />,
            label: 'Phỏng vấn sắp tới',
            value: stats?.upcoming_interviews,
            deltaValue: stats?.upcoming_interviews_delta,
            iconGradient: 'from-lime-500 to-emerald-600',
        },
    ];

    const quickActions = [
        { icon: <PlusSquare className="w-6 h-6" />, label: 'Đăng tin mới', to: '/employer/jobs/create', gradient: 'from-cyan-500 to-violet-500' },
        { icon: <Search className="w-6 h-6" />, label: 'Tìm CV', to: '/employer/cv-search', gradient: 'from-violet-500 to-pink-500' },
        { icon: <User2 className="w-6 h-6" />, label: 'Xem ứng viên', to: '/employer/candidates', gradient: 'from-emerald-500 to-cyan-500' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
            {/* ── Welcome Card ───────────────────────────── */}
            <motion.div {...fadeUp(0)}>
                <div className="relative overflow-hidden rounded-2xl glass-card p-6 lg:p-8 border border-white/8">
                    {/* Aurora blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1 font-medium">{getGreeting()},</p>
                            <h1 className="text-2xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400">
                                {companyName} 👋
                            </h1>
                            <p className="text-sm text-muted-foreground mt-2 capitalize">{dateStr}</p>
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
                        <KpiCard key={card.label} {...card} isLoading={statsLoading} />
                    ))}
                </div>
            </motion.div>

            {/* ── Applications Chart ─────────────────────── */}
            <motion.div {...fadeUp(0.18)}>
                <ApplicationsChart />
            </motion.div>

            {/* ── Interviews + Quick Links ────────────────── */}
            <motion.div {...fadeUp(0.24)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <UpcomingInterviewsCard />
                </div>

                <div className="xl:col-span-1">
                    <TopMatchesWidget />
                </div>

                {/* Quick Links */}
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-base">Thao tác nhanh</h3>
                    <div className="flex flex-col gap-1">
                        {[
                            { label: '📋 Đăng tin mới', to: '/employer/jobs/create', desc: 'Tạo tin tuyển dụng' },
                            { label: '🔍 Tìm CV', to: '/employer/cv-search', desc: 'Khám phá hồ sơ ứng viên' },
                            { label: '👥 Xem ứng viên', to: '/employer/candidates', desc: 'Quản lý danh sách ứng viên' },
                            { label: '📊 Báo cáo', to: '/employer/analytics', desc: 'Phân tích hiệu quả tuyển dụng' },
                            { label: '⚙️ Cài đặt', to: '/employer/settings', desc: 'Tùy chỉnh tài khoản' },
                        ].map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all group"
                            >
                                <div>
                                    <p className="text-sm font-semibold">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Search className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ── Recent Applications ─────────────────────── */}
            <motion.div {...fadeUp(0.3)}>
                <RecentApplicationsTable />
            </motion.div>
        </div>
    );
}
