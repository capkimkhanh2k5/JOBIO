import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type: 'application' | 'interview' | 'view' | 'warning' | 'review' | 'system';
    link?: string;
}

export interface NotificationSettings {
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    application_updates: boolean;
    interview_reminders: boolean;
}

interface NotificationState {
    unreadCount: number;
    notifications: NotificationItem[];
    settings: NotificationSettings | null;
    isLoading: boolean;
    isStreaming: boolean;

    // Actions
    fetchUnreadCount: () => Promise<void>;
    fetchRecentNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    startSimulation: () => void;
    stopSimulation: () => void;
    addNotification: (notification: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => {

    return {
        unreadCount: 0,
        notifications: [],
        settings: null,
        isLoading: false,
        isStreaming: false,

        fetchUnreadCount: async () => {
            try {
                const data = await notificationService.listNotifications({ page_size: 1, is_read: false }).then(r => r.data);
                set({ unreadCount: data.count });
            } catch (error) {
                console.error("Failed to fetch unread count", error);
            }
        },

        fetchRecentNotifications: async () => {
            try {
                set({ isLoading: true });
                const data = await notificationService.listNotifications({ page_size: 10 }).then(r => r.data.results);
                set({ notifications: data as unknown as NotificationItem[], isLoading: false });
            } catch (error) {
                console.error("Failed to fetch recent notifications", error);
                set({ isLoading: false });
            }
        },

        markAsRead: async (id: string) => {
            try {
                // Optimistic update
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, is_read: true } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1)
                }));

                await notificationService.markNotificationRead(Number(id));
            } catch (error) {
                console.error("Failed to mark notification as read", error);
                // Revert could be implemented here
            }
        },

        markAllAsRead: async () => {
            try {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                    unreadCount: 0
                }));
                await notificationService.markAllNotificationsRead();
            } catch (error) {
                console.error("Failed to mark all as read", error);
            }
        },

        addNotification: (notification: NotificationItem) => {
            set((state) => ({
                notifications: [notification, ...state.notifications].slice(0, 50), // Keeping a max size
                unreadCount: state.unreadCount + 1
            }));
        },

        startSimulation: () => {
            if (get().isStreaming) return;
            set({ isStreaming: true });

            // Initial fetch
            get().fetchUnreadCount();
        },

        stopSimulation: () => {
            set({ isStreaming: false });
        }
    };
});
