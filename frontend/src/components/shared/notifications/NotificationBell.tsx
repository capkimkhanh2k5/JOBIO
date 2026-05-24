import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';
import { useUserStore } from '@/store/userStore';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationDropdown } from './NotificationDropdown';
import { toast } from 'sonner';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const isAuthenticated = useUserStore((state) => state.isAuthenticated);

    const {
        unreadCount,
        fetchRecentNotifications,
        startSimulation,
        stopSimulation,
    } = useNotificationStore();

    useEffect(() => {
        if (!isAuthenticated) return;

        // startSimulation internally fetches count + notifications, then starts polling
        startSimulation();

        // Toast on new notification event (dispatched by SSE or future push)
        const handleNewNotification = (e: any) => {
            const notif = e.detail;
            toast(notif.title, {
                description: notif.message ?? notif.content,
                icon: <Bell className="w-4 h-4 text-primary" />,
            });
        };

        window.addEventListener('new-notification', handleNewNotification);

        return () => {
            stopSimulation();
            window.removeEventListener('new-notification', handleNewNotification);
        };
    }, [isAuthenticated]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Refresh list when user opens the dropdown
            fetchRecentNotifications();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
                    className="relative rounded-full w-10 h-10 lg:w-12 lg:h-12 hover:bg-primary/10 transition-colors magnetic-button"
                >
                    <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-foreground/80" />

                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-black leading-[18px] text-white text-center shadow-sm ring-2 ring-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 md:w-[500px] p-0 border border-slate-200 bg-white shadow-2xl rounded-2xl overflow-hidden"
                sideOffset={8}
            >
                <NotificationDropdown onClose={() => setIsOpen(false)} />
            </PopoverContent>
        </Popover>
    );
};
