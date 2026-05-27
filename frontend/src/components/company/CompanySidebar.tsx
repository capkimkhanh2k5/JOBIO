import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, PlusSquare, Briefcase, Users,
    CalendarClock, BarChart3, Building2,
    Settings, LifeBuoy, Search, History, BookOpen, Bell,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.04, duration: 0.3 },
    }),
};

/**
 * CompanySidebar — follows the admin design language.
 * Clean white background, violet active state, consistent with AdminSidebar.
 * @see UI_RULES.md §11.3, §8.1
 */
export function CompanySidebar() {
    const location = useLocation();
    const unreadCount = useNotificationStore((state) => state.unreadCount);

    const navItems: NavItem[] = [
        { label: 'Dashboard', path: '/company/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Đăng tin', path: '/company/jobs/create', icon: <PlusSquare className="w-5 h-5" /> },
        { label: 'Quản lý tin', path: '/company/jobs', icon: <Briefcase className="w-5 h-5" /> },
        { label: 'Ứng viên', path: '/company/candidates', icon: <Users className="w-5 h-5" /> },
        { label: 'Tìm CV', path: '/company/cv-search', icon: <Search className="w-5 h-5" /> },
        { label: 'Phỏng vấn', path: '/company/interviews', icon: <CalendarClock className="w-5 h-5" /> },
        {
            label: 'Thông báo',
            path: '/company/notifications',
            icon: <Bell className="w-5 h-5" />,
            badge: unreadCount,
        },
        { label: 'Báo cáo', path: '/company/analytics', icon: <BarChart3 className="w-5 h-5" /> },
        { label: 'Hồ sơ công ty', path: '/company/profile', icon: <Building2 className="w-5 h-5" /> },
        { label: 'Lịch sử giao dịch', path: '/company/billing', icon: <History className="w-5 h-5" /> },
    ];

    const bottomItems: NavItem[] = [
        { label: 'Cài đặt', path: '/company/settings', icon: <Settings className="w-5 h-5" /> },
        { label: 'Hỗ trợ', path: '/company/support', icon: <LifeBuoy className="w-5 h-5" /> },
        { label: 'Blog', path: '/company/blog', icon: <BookOpen className="w-5 h-5" /> },
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
                    className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative
                        ${isActive
                            ? 'bg-violet-50/80 text-violet-700 shadow-sm border border-violet-100/50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`}
                >
                    {isActive && (
                        <motion.span
                            layoutId="company-sidebar-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-md -ml-3"
                        />
                    )}
                    <span
                        className={`transition-colors duration-200 ${isActive
                            ? 'text-violet-600'
                            : 'text-slate-400 group-hover:text-violet-600'
                            }`}
                    >
                        {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                        <span className="min-w-[20px] h-5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full flex items-center justify-center px-1.5 border border-red-200">
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
                    className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                        ${isActive
                            ? 'bg-slate-100 text-slate-900 border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`}
                >
                    <span
                        className={`transition-colors ${isActive
                            ? 'text-slate-700'
                            : 'text-slate-400 group-hover:text-slate-600'
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
            className="hidden md:flex flex-col w-64 shrink-0 h-[calc(100vh-112px)] sticky top-[112px] border-r border-slate-200 bg-white"
            aria-label="Company Navigation"
        >
            <div className="flex-1 pt-5 pb-4 flex flex-col gap-1 overflow-y-auto">
                {/* Section label */}
                <div className="px-6 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Company Panel
                    </p>
                </div>

                {/* Main nav items */}
                {navItems.map((item, i) => renderNavItem(item, i))}

                {/* Divider */}
                <div className="my-3 mx-6 border-t border-slate-100" />

                {/* Bottom items */}
                {bottomItems.map((item, i) => renderBottomItem(item, i))}
            </div>

            {/* Bottom promo card */}
            <div className="p-4 m-3 mb-4 rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50/50 to-transparent border border-violet-100">
                <p className="text-xs font-bold text-slate-900 mb-1">🚀 Nâng cấp Pro</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">
                    Tiếp cận nhiều CV hơn, tăng hiển thị tin tuyển dụng.
                </p>
                <Link
                    to="/pricing"
                    className="block w-full text-center text-[11px] font-bold py-2 rounded-lg bg-violet-600 text-white shadow-sm hover:bg-violet-700 hover:shadow transition-all"
                >
                    Xem gói dịch vụ
                </Link>
            </div>
        </aside>
    );
}
