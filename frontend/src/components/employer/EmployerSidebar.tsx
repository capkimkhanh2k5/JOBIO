import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, PlusSquare, Briefcase, Users, Megaphone,
    CalendarClock, MessageSquare, BarChart3, Building2, CreditCard,
    Settings, LifeBuoy, UserPlus, Search, History, BookOpen
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/employer/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Đăng tin', path: '/employer/jobs/create', icon: <PlusSquare className="w-5 h-5" /> },
    { label: 'Quản lý tin', path: '/employer/jobs', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Ứng viên', path: '/employer/candidates', icon: <Users className="w-5 h-5" /> },
    { label: 'Tìm CV', path: '/employer/cv-search', icon: <Search className="w-5 h-5" /> },
    { label: 'Giới thiệu', path: '/employer/referrals', icon: <UserPlus className="w-5 h-5" /> },
    { label: 'Campaigns', path: '/employer/campaigns', icon: <Megaphone className="w-5 h-5" /> },
    { label: 'Phỏng vấn', path: '/employer/interviews', icon: <CalendarClock className="w-5 h-5" /> },
    { label: 'Tin nhắn', path: '/employer/messages', icon: <MessageSquare className="w-5 h-5" />, badge: 3 },
    { label: 'Báo cáo', path: '/employer/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Hồ sơ công ty', path: '/employer/company', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Gói dịch vụ', path: '/employer/subscription', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Lịch sử giao dịch', path: '/employer/billing', icon: <History className="w-5 h-5" /> },
    { label: 'Cài đặt', path: '/employer/settings', icon: <Settings className="w-5 h-5" /> },
    { label: 'Hỗ trợ', path: '/employer/support', icon: <LifeBuoy className="w-5 h-5" /> },
    { label: 'Blog', path: '/employer/blog', icon: <BookOpen className="w-5 h-5" /> },
];

// Split into main and bottom sections
const mainItems = navItems.slice(0, 13);
const bottomItems = navItems.slice(13);

const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.3 } }),
};

export function EmployerSidebar() {
    const location = useLocation();

    const checkIsActive = (path: string) => {
        if (path === '/employer/dashboard') return location.pathname === path;
        if (path === '/employer/jobs') {
            return location.pathname === path || (location.pathname.startsWith(path) && !location.pathname.startsWith('/employer/jobs/create'));
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside
            className="hidden md:flex flex-col w-64 shrink-0 h-[calc(100vh-112px)] sticky top-[112px] border-r border-white/5 bg-white/2 backdrop-blur-lg"
            aria-label="Employer Navigation"
        >
            {/* Top padding (matches topnav height) */}
            <div className="flex-1 pt-6 pb-4 flex flex-col gap-1 overflow-y-auto">
                <div className="px-3 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3">Menu</p>
                </div>
                {mainItems.map((item, i) => {
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
                                className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative
                                    ${isActive
                                        ? 'bg-violet-50 text-violet-700 border border-violet-100'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                                    }`
                                }
                                aria-label={item.label}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="employer-sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-600 rounded-full -ml-3"
                                    />
                                )}
                                <span className={`transition-colors duration-200 ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                    {item.icon}
                                </span>
                                <span className="flex-1">{item.label}</span>
                                {item.badge && (
                                    <span className="min-w-[20px] h-5 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full flex items-center justify-center px-1.5">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}

                {/* Divider */}
                <div className="my-3 mx-6 border-t border-slate-100" />

                {/* Bottom items */}
                {bottomItems.map((item, i) => {
                    const isActive = checkIsActive(item.path);
                    return (
                        <motion.div
                            key={item.path}
                            custom={mainItems.length + i}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative
                                    ${isActive
                                        ? 'bg-violet-50 text-violet-700 border border-violet-100'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                                    }`
                                }
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="employer-sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-600 rounded-full -ml-3"
                                    />
                                )}
                                <span className={`transition-colors duration-200 ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* Subscription promo */}
            <div className="p-4 m-3 mb-4 rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50/50 to-transparent border border-violet-100">
                <p className="text-xs font-bold text-slate-900 mb-1">🚀 Nâng cấp Pro</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">Tiếp cận nhiều CV hơn, tăng hiển thị tin tuyển dụng.</p>
                <Link
                    to="/employer/subscription"
                    className="block w-full text-center text-[11px] font-bold py-2 rounded-lg bg-violet-600 text-white shadow-sm hover:bg-violet-700 hover:shadow transition-all"
                >
                    Xem gói dịch vụ
                </Link>
            </div>
        </aside>
    );
}

