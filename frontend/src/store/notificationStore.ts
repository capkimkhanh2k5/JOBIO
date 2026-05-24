import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import { useUserStore } from './userStore';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    // Maps to notification_type.type_name from backend
    type: 'application' | 'interview' | 'view' | 'warning' | 'system' | 'verification' | 'report' | 'job_alert' | 'billing';
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
    startPolling: () => void;
    stopPolling: () => void;
    addNotification: (notification: NotificationItem) => void;
    // Keep old names for backward compat with NotificationBell
    startSimulation: () => void;
    stopSimulation: () => void;
}

let _pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => {

    return {
        unreadCount: 0,
        notifications: [],
        settings: null,
        isLoading: false,
        isStreaming: false,

        fetchUnreadCount: async () => {
            try {
                const data = await notificationService.getUnreadCount().then(r => r.data);
                set({ unreadCount: data.unread_count ?? 0 });
            } catch (error) {
                try {
                    const data = await notificationService
                        .listNotifications({ page_size: 1, is_read: false })
                        .then(r => r.data);
                    set({ unreadCount: data.count ?? 0 });
                } catch (fallbackError) {
                    console.error('Failed to fetch unread count', fallbackError || error);
                }
            }
        },

        fetchRecentNotifications: async () => {
            try {
                set({ isLoading: true });
                const results = await notificationService
                    .listNotifications({ page_size: 15 })
                    .then(r => r.data.results);

                // Map backend fields → NotificationItem
                const mapped: NotificationItem[] = (results as any[]).map(n => ({
                    id: String(n.id),
                    title: n.title,
                    message: n.content ?? n.message ?? '',
                    is_read: n.is_read,
                    created_at: n.created_at,
                    // Backend stores type_name in notification_type.type_name
                    type: (n.notification_type?.type_name ?? 'system') as NotificationItem['type'],
                    link: n.link || undefined,
                }));

                set({ notifications: mapped, isLoading: false });
            } catch (error) {
                console.error('Failed to fetch recent notifications', error);
                set({ isLoading: false });
            }
        },

        markAsRead: async (id: string) => {
            // Optimistic update
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));

            try {
                await notificationService.markNotificationRead(Number(id));
            } catch (error) {
                console.error('Failed to mark notification as read', error);
                // Revert optimistic update on failure
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, is_read: false } : n
                    ),
                    unreadCount: state.unreadCount + 1,
                }));
            }
        },

        markAllAsRead: async () => {
            // Optimistic update
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                unreadCount: 0,
            }));

            try {
                await notificationService.markAllNotificationsRead();
            } catch (error) {
                console.error('Failed to mark all as read', error);
            }
        },

        addNotification: (notification: NotificationItem) => {
            set((state) => ({
                notifications: [notification, ...state.notifications].slice(0, 50),
                unreadCount: state.unreadCount + 1,
            }));
        },

        // ── Polling-based real-time (replaces broken SSE+JWT approach) ───────────
        startPolling: () => {
            if (_pollingInterval) return; // already running

            set({ isStreaming: true });

            // Immediate fetch on start
            get().fetchUnreadCount();
            get().fetchRecentNotifications();

            // Poll every 30 seconds
            _pollingInterval = setInterval(() => {
                const isAuth = useUserStore.getState().isAuthenticated;
                if (!isAuth) {
                    get().stopPolling();
                    return;
                }
                get().fetchUnreadCount();
            }, 30_000);
        },

        stopPolling: () => {
            if (_pollingInterval) {
                clearInterval(_pollingInterval);
                _pollingInterval = null;
            }
            set({ isStreaming: false });
        },

        // Aliases – NotificationBell still calls startSimulation / stopSimulation
        startSimulation() { get().startPolling(); },
        stopSimulation() { get().stopPolling(); },
    };
});
