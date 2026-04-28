import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, FileText,
    Settings, Shield, LogOut,
    Wallet, Briefcase, AlertTriangle, Database, Bell, Mail
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

const bottomItems = [
    { label: 'Cài đặt hệ thống', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.4,
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

    const { unreadCount } = useNotificationStore();

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Thông báo', path: '/admin/notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
        { label: 'Quản lý Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
        { label: 'Tài chính', path: '/admin/financial', icon: <Wallet className="w-5 h-5" /> },
        { label: 'Thị trường Việc làm', path: '/admin/jobs', icon: <Briefcase className="w-5 h-5" /> },
        { label: 'Báo cáo vi phạm', path: '/admin/reports', icon: <AlertTriangle className="w-5 h-5" />, badge: pendingReports },
        { label: 'Duyệt & Kiểm duyệt', path: '/admin/moderation', icon: <Shield className="w-5 h-5" />, badge: pendingCompanies },
        { label: 'Quản lý Blog', path: '/admin/blog', icon: <FileText className="w-5 h-5" /> },
        { label: 'Dữ liệu danh mục', path: '/admin/master-data', icon: <Database className="w-5 h-5" /> },
        { label: 'Quản lý Email', path: '/admin/email-manager', icon: <Mail className="w-5 h-5" /> },
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
            className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white"
            aria-label="Admin Navigation"
        >
            <div className="flex-1 pt-6 pb-4 flex flex-col gap-1 overflow-y-auto">
                <div className="px-6 mb-8">
                    <Logo
                        to="/admin/dashboard"
                        imageClassName="h-10 w-auto object-contain drop-shadow"
                        textClassName="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter"
                    />
                </div>
                <div className="px-6 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Admin Control</p>
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
                                `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-violet-50/80 text-violet-700 shadow-sm border border-violet-100/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                                }`
                            }
                            aria-label={item.label}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="admin-sidebar-active"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-md -ml-3"
                                        />
                                    )}
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-violet-600'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="min-w-[20px] h-5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full flex items-center justify-center px-1.5 border border-red-200">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}

                <div className="my-3 mx-6 border-t border-slate-100" />

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
                                `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                                ${isActive
                                    ? 'bg-slate-100 text-slate-900 border border-slate-200/60'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`transition-colors ${isActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
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
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                        <AvatarImage src={user?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-violet-600 text-white text-[10px] font-black">
                            {user?.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{user?.full_name}</p>
                        <p className="text-[10px] font-bold text-violet-600 uppercase truncate">Admin</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs px-3 transition-colors"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}
