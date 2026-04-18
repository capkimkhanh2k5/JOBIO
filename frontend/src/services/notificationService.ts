import api from './api';
import type { PaginatedResponse, Notification, NotificationSettings } from '@/types/api';

// ─── Unified Notification services (Shared by Candidate & Company) ────────────

export const notificationService = {
    listNotifications(params?: { is_read?: boolean; page?: number; page_size?: number }) {
        return api.get<PaginatedResponse<Notification>>('/api/notifications/', { params });
    },

    markNotificationRead(id: number) {
        return api.patch(`/api/notifications/${id}/read/`);
    },

    markAllNotificationsRead() {
        return api.patch('/api/notifications/read-all/');
    },

    getNotificationSettings() {
        return api.get<NotificationSettings>('/api/notifications/settings/');
    },

    updateNotificationSettings(data: Partial<NotificationSettings>) {
        return api.patch<NotificationSettings>('/api/notifications/settings/', data);
    },
};
