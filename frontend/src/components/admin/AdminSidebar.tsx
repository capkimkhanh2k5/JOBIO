import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, FileText,
    Settings, Shield, LogOut,
    Wallet, Briefcase, AlertTriangle, Database, Bell, Activity, Tags
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { useNotificationStore } from '@/store/notificationStore';
import { useEffect } from 'react';

const bottomItems = [
    { label: 'Cài đặt hệ thống', path: '/admin/settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.04,
            duration: 0.35,
            ease: [0.215, 0.61, 0.355, 1] as any
        }
    }),
};

export function AdminSidebar() {
    const { user, clearAuth } = useUserStore();
    const navigate = useNavigate();

    // ── Fetch badge counts from real API ─────────────────────────────────
    const { data: overview } = useQuery({
        queryKey: ['sidebar-badges'],
        queryFn: () => dashboardService.getSidebarBadges().then(r => r.data),
        staleTime: 60_000,       // cache 1 phút
        refetchInterval: 120_000, // tự refresh mỗi 2 phút
    });

    const pendingReports = overview?.reports?.pending ?? 0;
    const pendingCompanies = overview?.companies?.pending_verification ?? 0;

    const { unreadCount, fetchUnreadCount } = useNotificationStore();

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
        { label: 'Thông báo', path: '/admin/notifications', icon: <Bell className="w-[18px] h-[18px]" />, badge: unreadCount },
        { label: 'Quản lý Khách hàng', path: '/admin/users', icon: <Users className="w-[18px] h-[18px]" /> },
        { label: 'Tài chính', path: '/admin/financial', icon: <Wallet className="w-[18px] h-[18px]" /> },
        { label: 'Thị trường Việc làm', path: '/admin/jobs', icon: <Briefcase className="w-[18px] h-[18px]" /> },
        { label: 'Báo cáo vi phạm', path: '/admin/reports', icon: <AlertTriangle className="w-[18px] h-[18px]" />, badge: pendingReports },
        { label: 'Duyệt & Kiểm duyệt', path: '/admin/moderation', icon: <Shield className="w-[18px] h-[18px]" />, badge: pendingCompanies },
        { label: 'Quản lý Blog', path: '/admin/blog', icon: <FileText className="w-[18px] h-[18px]" /> },
        { label: 'Dữ liệu danh mục', path: '/admin/master-data', icon: <Database className="w-[18px] h-[18px]" /> },
        { label: 'Vận hành AI Gợi ý', path: '/admin/recommendations', icon: <Activity className="w-[18px] h-[18px]" /> },
        { label: 'Từ điển Chuẩn hóa AI', path: '/admin/recommendation-taxonomy', icon: <Tags className="w-[18px] h-[18px]" /> },
    ];

    const handleLogout = async () => {
        try {
            await authService.logout();
            clearAuth();
            toast.success('Đã đăng xuất');
            navigate('/');
        } catch {
            clearAuth();
            navigate('/');
        }
    };

    return (
        <aside
            className="hidden md:flex flex-col w-[230px] shrink-0 h-screen sticky top-0 border-r border-border/60 bg-card"
            aria-label="Admin Navigation"
        >
            {/* Logo area */}
            <div className="flex-none pt-6 pb-5 px-6">
                <Logo
                    to="/"
                    imageClassName="h-9 w-auto object-contain drop-shadow"
                    textClassName="text-xl font-black text-teal-600 tracking-tighter"
                />
            </div>

            {/* Nav items — scrollable */}
            <div className="flex-1 pb-4 flex flex-col gap-0.5 overflow-y-auto">
                {/* Section label */}
                <div className="px-6 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                        Admin Control
                    </p>
                </div>

                {navItems.map((item, i) => (
                    <motion.div
                        key={item.path}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <NavLink
                            to={item.path}
                            end={item.path === '/admin/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 mx-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-primary/8 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                }`
                            }
                            aria-label={item.label}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="admin-sidebar-active"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[var(--brand-teal)] to-[var(--brand-teal-light)] rounded-r-full -ml-3"
                                        />
                                    )}
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-primary'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="min-w-[18px] h-[18px] text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center justify-center px-1 border border-red-200/60">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}

                {/* Divider */}
                <div className="my-3 mx-6 border-t border-border/40" />

                {/* Bottom items */}
                {bottomItems.map((item, i) => (
                    <motion.div
                        key={item.path}
                        custom={navItems.length + i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 mx-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group
                                ${isActive
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`transition-colors ${isActive ? 'text-foreground/70' : 'text-muted-foreground/50 group-hover:text-foreground/60'}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}
            </div>

            {/* Admin Profile & Logout at Bottom */}
            <div className="flex-none p-3 border-t border-border/60 bg-card">
                <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 shadow-xs mb-2.5">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-emerald-500/30 shadow-xs shrink-0">
                            <AvatarImage src={user?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-600 to-emerald-500 text-white text-[10px] font-bold">
                                {user?.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-foreground truncate leading-tight">{user?.full_name}</p>
                            <div className="mt-1 flex items-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
                                    ADMIN
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 h-8.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs px-3 transition-colors"
                    onClick={handleLogout}
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}
