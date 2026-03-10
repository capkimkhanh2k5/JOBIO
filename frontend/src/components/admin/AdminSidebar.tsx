import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, Building2, Star, FileText,
    Mail, Settings, Activity, Shield
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Quản lý Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Duyệt & Kiểm duyệt', path: '/admin/moderation', icon: <Shield className="w-5 h-5" />, badge: 5 },
    { label: 'Quản lý Blog', path: '/admin/blog', icon: <FileText className="w-5 h-5" /> },
    { label: 'Email Templates', path: '/admin/email-templates', icon: <Mail className="w-5 h-5" /> },
];

const bottomItems: NavItem[] = [
    { label: 'Cài đặt hệ thống', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.3 } }),
};

export function AdminSidebar() {
    return (
        <aside
            className="hidden md:flex flex-col w-64 shrink-0 h-full border-r border-white/5 bg-white/2 backdrop-blur-lg"
            aria-label="Admin Navigation"
        >
            <div className="flex-1 pt-6 pb-4 flex flex-col gap-1 overflow-y-auto">
                <div className="px-3 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3">Admin Panel</p>
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
                                    ? 'bg-blue-50/80 text-blue-700 shadow-sm border border-blue-100/50'
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
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md -ml-3"
                                        />
                                    )}
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="min-w-[20px] h-5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full flex items-center justify-center px-1.5 border border-red-200">
                                            {item.badge}
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

            {/* Admin info box */}
            <div className="p-4 m-3 mb-4 rounded-2xl bg-gradient-to-br from-slate-50/50 to-blue-50/50 border border-slate-100/50">
                <p className="text-xs font-bold text-slate-900 mb-1">⚡ Admin Panel</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Quản trị hệ thống JOBIO. Mọi thay đổi sẽ ảnh hưởng toàn bộ platform.</p>
            </div>
        </aside>
    );
}
