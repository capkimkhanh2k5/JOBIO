import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';
import { useUserStore } from '@/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    CheckCheck, FileText, Calendar, Eye,
    AlertTriangle, Bell, ShieldCheck, CreditCard
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


// ─── Icon per notification type ──────────────────────────────────────────────
const getIcon = (type: string) => {
    switch (type) {
        case 'application':   return <FileText className="w-4 h-4 text-blue-500" />;
        case 'interview':     return <Calendar className="w-4 h-4 text-violet-500" />;
        case 'view':          return <Eye className="w-4 h-4 text-cyan-500" />;
        case 'warning':
        case 'report':        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        case 'verification':  return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
        case 'billing':       return <CreditCard className="w-4 h-4 text-green-500" />;
        case 'system':
        default:              return <Bell className="w-4 h-4 text-slate-400" />;
    }
};

// ─── "View all" destination per role ─────────────────────────────────────────
const viewAllHref = (role?: string) => {
    if (role === 'admin')   return '/admin/notifications';
    if (role === 'company') return '/company/notifications';
    return '/candidate/notifications';
};

// ─── Component ────────────────────────────────────────────────────────────────
export const NotificationDropdown = ({ onClose }: { onClose?: () => void }) => {
    const navigate = useNavigate();
    const { user } = useUserStore();

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isLoading,
    } = useNotificationStore();

    const handleItemClick = (id: string, isRead: boolean, link?: string) => {
        if (!isRead) markAsRead(id);
        if (onClose) onClose();
        if (!link) return;

        if (/^https?:\/\//i.test(link)) {
            window.open(link, '_blank', 'noopener,noreferrer');
            return;
        }

        navigate(link);
    };

    return (
        <div className="flex flex-col w-full">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Thông báo</h3>
                    {unreadCount > 0 && (
                        <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                            {unreadCount} mới
                        </span>
                    )}
                </div>

                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 gap-1.5 transition-all border border-transparent hover:border-primary/20"
                        onClick={() => markAllAsRead()}
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đánh dấu đã đọc
                    </Button>
                )}
            </div>

            {/* ── List ── */}
            <ScrollArea className="h-[360px] w-full">
                {isLoading ? (
                    /* Skeleton loader */
                    <div className="flex flex-col gap-0">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 border-b border-border/20">
                                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-full rounded" />
                                    <Skeleton className="h-2 w-1/3 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="flex flex-col">
                        {notifications.slice(0, 15).map((notif) => (
                            <div
                                key={notif.id}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleItemClick(notif.id, notif.is_read, notif.link)}
                                className={`flex items-start gap-4 px-5 py-4 border-b border-border/20 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.is_read ? 'bg-primary/[0.03]' : ''}`}
                                onClick={() => handleItemClick(notif.id, notif.is_read, notif.link)}
                            >
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 border shadow-sm ${!notif.is_read ? 'bg-white border-primary/20 shadow-primary/5' : 'bg-slate-100 border-slate-200'}`}>
                                    {getIcon(notif.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold leading-snug mb-1 ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {notif.title}
                                    </p>
                                    <p className={cn(
                                        "text-xs line-clamp-2 leading-relaxed mb-1.5",
                                        !notif.is_read ? "text-slate-700 font-medium" : "text-slate-500"
                                    )}>
                                        {notif.message}
                                    </p>
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                        <Bell className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                    </span>
                                </div>

                                {/* Unread indicator */}
                                {!notif.is_read && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-sm shadow-primary/40 ring-4 ring-primary/10" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Không có thông báo mới</p>
                        <p className="text-xs text-muted-foreground mt-1">Bạn đã xem tất cả thông báo.</p>
                    </div>
                )}
            </ScrollArea>

            {/* ── Footer ── */}
            <div className="p-2 border-t border-border/40">
                <Link to={viewAllHref(user?.role)} onClick={onClose}>
                    <Button
                        variant="ghost"
                        className="w-full h-9 text-sm text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        Xem tất cả thông báo
                    </Button>
                </Link>
            </div>
        </div>
    );
};
