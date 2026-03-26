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
        fetchUnreadCount,
        fetchRecentNotifications,
        startSimulation,
        stopSimulation
    } = useNotificationStore();

    useEffect(() => {
        // Only fetch notifications when authenticated
        if (!isAuthenticated) return;

        // Init fetch
        fetchUnreadCount();
        fetchRecentNotifications();

        // Start simulated SSE connection
        startSimulation();

        // Listen for internal simulation events
        const handleNewNotification = (e: any) => {
            const notif = e.detail;
            toast(notif.title, {
                description: notif.message,
                icon: <Bell className="w-4 h-4 text-primary" />,
            });
        };

        window.addEventListener('new-notification', handleNewNotification);

        return () => {
            stopSimulation();
            window.removeEventListener('new-notification', handleNewNotification);
        };
    }, [isAuthenticated]);

    // Also handle regular polling or refresh when popover is opened
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            fetchRecentNotifications();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full w-10 h-10 lg:w-12 lg:h-12 hover:bg-primary/10 transition-colors magnetic-button"
                >
                    <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-foreground/80" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 lg:top-3 lg:right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 md:w-96 p-0 border border-slate-200 bg-white shadow-2xl rounded-2xl overflow-hidden"
                sideOffset={8}
            >
                <NotificationDropdown onClose={() => setIsOpen(false)} />
            </PopoverContent>
        </Popover>
    );
};
