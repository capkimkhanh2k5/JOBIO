import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, PlusSquare, Briefcase, Users,
    CalendarClock, BarChart3, Building2,
    Settings, LifeBuoy, History, BookOpen, Bell,
    UserCog,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.035, duration: 0.3, ease: [0.215, 0.61, 0.355, 1] as any },
    }),
};

/**
 * CompanySidebar — follows the Editorial Luxury design language.
 * Clean card background, teal active state with gradient indicator.
 */
export function CompanySidebar() {
    const location = useLocation();
    const unreadCount = useNotificationStore((state) => state.unreadCount);

    const navItems: NavItem[] = [
        { label: 'Dashboard', path: '/company/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
        { label: 'Đăng tin', path: '/company/jobs/create', icon: <PlusSquare className="w-[18px] h-[18px]" /> },
        { label: 'Quản lý tin', path: '/company/jobs', icon: <Briefcase className="w-[18px] h-[18px]" /> },
        { label: 'Ứng viên', path: '/company/candidates', icon: <Users className="w-[18px] h-[18px]" /> },
        { label: 'Phỏng vấn', path: '/company/interviews', icon: <CalendarClock className="w-[18px] h-[18px]" /> },
        {
            label: 'Thông báo',
            path: '/company/notifications',
            icon: <Bell className="w-[18px] h-[18px]" />,
            badge: unreadCount,
        },
        { label: 'Báo cáo', path: '/company/analytics', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
        { label: 'Team', path: '/company/team', icon: <UserCog className="w-[18px] h-[18px]" /> },
        { label: 'Hồ sơ công ty', path: '/company/profile', icon: <Building2 className="w-[18px] h-[18px]" /> },
        { label: 'Lịch sử giao dịch', path: '/company/billing', icon: <History className="w-[18px] h-[18px]" /> },
        { label: 'Blog', path: '/company/blog', icon: <BookOpen className="w-[18px] h-[18px]" /> },
    ];

    const bottomItems: NavItem[] = [
        { label: 'Cài đặt', path: '/company/settings', icon: <Settings className="w-[18px] h-[18px]" /> },
        { label: 'Hỗ trợ', path: '/company/support', icon: <LifeBuoy className="w-[18px] h-[18px]" /> },
    ];

    const checkIsActive = (path: string) => {
        if (path === '/company/dashboard') return location.pathname === path;
        if (path === '/company/jobs') {
            return (
                location.pathname === path ||
                (location.pathname.startsWith(path) &&
                    !location.pathname.startsWith('/company/jobs/create'))
            );
        }
        return location.pathname.startsWith(path);
    };

    const renderNavItem = (item: NavItem, i: number) => {
        const isActive = checkIsActive(item.path);
        return (
            <motion.div
                key={item.path}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <Link
                    to={item.path}
                    aria-label={item.label}
                    className={`flex items-center gap-3 mx-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group relative
                        ${isActive
                            ? 'bg-primary/8 text-primary shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                >
                    {isActive && (
                        <motion.span
                            layoutId="company-sidebar-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[var(--brand-teal)] to-[var(--brand-teal-light)] rounded-r-full -ml-3"
                        />
                    )}
                    <span
                        className={`transition-colors duration-200 ${isActive
                            ? 'text-primary'
                            : 'text-muted-foreground/60 group-hover:text-primary'
                            }`}
                    >
                        {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                        <span className="min-w-[18px] h-[18px] text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center justify-center px-1 border border-red-200/60">
                            {item.badge > 99 ? '99+' : item.badge}
                        </span>
                    )}
                </Link>
            </motion.div>
        );
    };

    const renderBottomItem = (item: NavItem, i: number) => {
        const isActive = checkIsActive(item.path);
        return (
            <motion.div
                key={item.path}
                custom={navItems.length + i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <Link
                    to={item.path}
                    className={`flex items-center gap-3 mx-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group
                        ${isActive
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                >
                    <span
                        className={`transition-colors ${isActive
                            ? 'text-foreground/70'
                            : 'text-muted-foreground/50 group-hover:text-foreground/60'
                            }`}
                    >
                        {item.icon}
                    </span>
                    <span>{item.label}</span>
                </Link>
            </motion.div>
        );
    };

    return (
        <aside
            className="hidden md:flex flex-col w-[230px] shrink-0 h-[calc(100vh-84px)] sticky top-[84px] border-r border-border/60 bg-card"
            aria-label="Company Navigation"
        >
            <div className="flex-1 pt-5 pb-4 flex flex-col gap-0.5 overflow-y-auto">
                {/* Section label */}
                <div className="px-6 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                        Company Panel
                    </p>
                </div>

                {/* Main nav items */}
                {navItems.map((item, i) => renderNavItem(item, i))}

                {/* Divider */}
                <div className="my-3 mx-6 border-t border-border/40" />

                {/* Bottom items */}
                {bottomItems.map((item, i) => renderBottomItem(item, i))}
            </div>

            {/* Bottom promo card — editorial gradient */}
            <div className="p-4 m-3 mb-4 rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/12">
                <p className="text-xs font-bold text-foreground mb-1">🚀 Nâng cấp Pro</p>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mb-3">
                    Tiếp cận nhiều CV hơn, tăng hiển thị tin tuyển dụng.
                </p>
                <Link
                    to="/pricing"
                    className="block w-full text-center text-[11px] font-bold py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:shadow transition-all"
                >
                    Xem gói dịch vụ
                </Link>
            </div>
        </aside>
    );
}
