import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, UserCircle, FileText, Briefcase, Bookmark,
    Bell, CheckSquare, MessageSquare, CalendarClock, Users, Settings
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/candidate/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Hồ sơ cá nhân', path: '/profile', icon: <UserCircle className="w-5 h-5" /> },
    { label: 'Quản lý CV', path: '/candidate/cv', icon: <FileText className="w-5 h-5" /> },
    { label: 'Việc đã ứng tuyển', path: '/candidate/applications', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Việc đã lưu', path: '/candidate/saved', icon: <Bookmark className="w-5 h-5" /> },
    { label: 'Job Alerts', path: '/candidate/alerts', icon: <Bell className="w-5 h-5" /> },
    { label: 'Bài test', path: '/candidate/assessments', icon: <CheckSquare className="w-5 h-5" /> },
    { label: 'Tin nhắn', path: '/candidate/messages', icon: <MessageSquare className="w-5 h-5" />, badge: 2 },
    { label: 'Phỏng vấn', path: '/candidate/interviews', icon: <CalendarClock className="w-5 h-5" /> },
    { label: 'Kết nối', path: '/candidate/connections', icon: <Users className="w-5 h-5" /> },
    { label: 'Cài đặt', path: '/candidate/settings', icon: <Settings className="w-5 h-5" /> },
];

const mainItems = navItems.slice(0, 7);
const bottomItems = navItems.slice(7);

const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.3 } }),
};

export function CandidateSidebar() {
    return (
        <aside
            className="hidden md:flex flex-col w-64 shrink-0 min-h-screen border-r border-white/5 bg-white/2 backdrop-blur-lg"
            aria-label="Candidate Navigation"
        >
            <div className="flex-1 pt-6 pb-4 flex flex-col gap-1 overflow-y-auto">
                <div className="px-3 mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3">Quản lý nghề nghiệp</p>
                </div>
                {mainItems.map((item, i) => (
                    <motion.div
                        key={item.path}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-violet-500/15 to-cyan-500/15 text-foreground border border-white/10 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="candidate-sidebar-active"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-violet-400 to-cyan-500 rounded-full -ml-3"
                                        />
                                    )}
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="min-w-[20px] h-5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded-full flex items-center justify-center px-1.5">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}

                <div className="my-3 mx-6 border-t border-white/5" />

                {bottomItems.map((item, i) => (
                    <motion.div
                        key={item.path}
                        custom={mainItems.length + i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                                ${isActive
                                    ? 'bg-white/8 text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span className="min-w-[20px] h-5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded-full flex items-center justify-center px-1.5 ml-auto">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 m-3 mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-transparent border border-white/8">
                <p className="text-xs font-bold text-foreground mb-1">Kiến tạo sự nghiệp</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">Tạo CV chuyên nghiệp bật nhất chỉ với 1 click.</p>
                <button className="block w-full text-center text-[11px] font-bold py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90 transition-opacity">
                    Cập nhật CV ngay
                </button>
            </div>
        </aside>
    );
}
