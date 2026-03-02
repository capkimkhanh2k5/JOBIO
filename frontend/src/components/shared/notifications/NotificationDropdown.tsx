import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    CheckCheck, FileText, Calendar, Eye,
    AlertTriangle, Star, Bell
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const NotificationDropdown = ({ onClose }: { onClose?: () => void }) => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isLoading
    } = useNotificationStore();

    const getIcon = (type: string) => {
        switch (type) {
            case 'application': return <FileText className="w-4 h-4 text-blue-400" />;
            case 'interview': return <Calendar className="w-4 h-4 text-violet-400" />;
            case 'view': return <Eye className="w-4 h-4 text-cyan-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'review': return <Star className="w-4 h-4 text-yellow-400" />;
            case 'system': return <Bell className="w-4 h-4 text-slate-400" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Thông báo</h3>
                    {unreadCount > 0 && (
                        <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} mới
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs hover:text-primary transition-colors"
                        onClick={() => markAllAsRead()}
                    >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Đánh dấu đã đọc
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[360px] w-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
                        <span className="text-sm">Đang tải...</span>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="flex flex-col">
                        {notifications.slice(0, 10).map((notif) => (
                            <div
                                key={notif.id}
                                className={`flex items-start gap-4 p-4 border-b border-border/20 transition-colors cursor-pointer group hover:bg-muted/30 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                                onClick={() => {
                                    if (!notif.is_read) markAsRead(notif.id);
                                    if (notif.link) {
                                        // Handle navigation logic here if link exists
                                        if (onClose) onClose();
                                    }
                                }}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notif.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium leading-none mb-1 ${!notif.is_read ? 'text-foreground' : 'text-foreground/80'}`}>
                                            {notif.title}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {notif.message}
                                    </p>
                                </div>

                                {!notif.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Không có thông báo mới</p>
                        <p className="text-xs text-muted-foreground mt-1">Bạn đã xem tất cả thông báo.</p>
                    </div>
                )}
            </ScrollArea>

            <div className="p-2 border-t border-border/40">
                <Link to="/candidate/notifications" onClick={onClose}>
                    <Button variant="ghost" className="w-full text-sm text-primary hover:bg-primary/10 transition-colors">
                        Xem tất cả thông báo
                    </Button>
                </Link>
            </div>
        </div>
    );
};
