import { Link, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useNotificationStore } from '@/store/notificationStore';
import { 
    LayoutDashboard, Briefcase, Users, FileText, Bell, Sparkles, Building2, CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomNav() {
    const { user, isAuthenticated } = useUserStore();
    const location = useLocation();
    const unreadCount = useNotificationStore((state) => state.unreadCount);

    if (!isAuthenticated || !user) return null;
    
    // Only show inside dashboard routes
    const isDashboard = location.pathname.startsWith('/company') || 
                        location.pathname.startsWith('/candidate') || 
                        location.pathname.startsWith('/admin');
                        
    if (!isDashboard) return null;

    let items: Array<{ path: string; label: string; icon: React.ReactNode; badge?: number }> = [];

    if (user.role === 'company') {
        items = [
            { path: '/company/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { path: '/company/jobs', label: 'Tuyển dụng', icon: <Briefcase size={20} /> },
            { path: '/company/candidates', label: 'Ứng viên', icon: <Users size={20} /> },
            { path: '/company/interviews', label: 'Phỏng vấn', icon: <CalendarClock size={20} /> },
            { path: '/company/notifications', label: 'Thông báo', icon: <Bell size={20} />, badge: unreadCount },
        ];
    } else if (user.role === 'candidate') {
        items = [
            { path: '/candidate/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { path: '/candidate/cv', label: 'Hồ sơ', icon: <FileText size={20} /> },
            { path: '/candidate/suggested-jobs', label: 'Gợi ý', icon: <Sparkles size={20} /> },
            { path: '/candidate/applications', label: 'Đã ứng tuyển', icon: <Briefcase size={20} /> },
            { path: '/candidate/notifications', label: 'Thông báo', icon: <Bell size={20} />, badge: unreadCount },
        ];
    } else if (user.role === 'admin') {
        items = [
            { path: '/admin/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
            { path: '/admin/users', label: 'Người dùng', icon: <Users size={20} /> },
            { path: '/admin/companies', label: 'Công ty', icon: <Building2 size={20} /> },
            { path: '/admin/jobs', label: 'Việc làm', icon: <Briefcase size={20} /> },
            { path: '/admin/notifications', label: 'Thông báo', icon: <Bell size={20} />, badge: unreadCount },
        ];
    }

    if (items.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
            >
                <div className="flex items-center justify-around px-2 h-16">
                    {items.map((item) => {
                        const isActive = location.pathname === item.path || 
                            (item.path !== '/' && item.path !== `/${user.role}/dashboard` && location.pathname.startsWith(item.path));
                            
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="relative">
                                    {item.icon}
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] text-[8px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-[3px] border border-background">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold tracking-tight transition-all",
                                    isActive ? "opacity-100" : "opacity-70"
                                )}>
                                    {item.label}
                                </span>
                                
                                {isActive && (
                                    <motion.div 
                                        layoutId="mobile-nav-indicator"
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-teal-500 to-teal-400 rounded-b-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </motion.nav>
        </AnimatePresence>
    );
}
