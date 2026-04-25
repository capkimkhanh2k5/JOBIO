import api from './api';
import type { PaginatedResponse, Notification, NotificationSettings } from '@/types/api';

// ─── Unified Notification services (Shared by Candidate & Company) ────────────

export const notificationService = {
    listNotifications(params?: { is_read?: boolean; page?: number; page_size?: number }) {
        return api.get<PaginatedResponse<Notification>>('/api/notifications/', { params });
    },

    listAdminNotifications(params?: {
        is_read?: boolean;
        type?: string;
        search?: string;
        page?: number;
        page_size?: number;
    }) {
        return api.get<PaginatedResponse<Notification>>('/api/notifications/admin-list/', { params });
    },

    markNotificationRead(id: number) {
        return api.patch(`/api/notifications/${id}/read/`);
    },

    markAdminNotificationRead(id: number) {
        return api.patch(`/api/notifications/admin-list/${id}/mark-as-read/`);
    },

    bulkMarkAdminNotificationsRead(ids: number[]) {
        return api.post('/api/notifications/admin-list/bulk-mark-as-read/', { ids });
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

    deleteNotification(id: number) {
        return api.delete(`/api/notifications/${id}/`);
    },

    clearAllNotifications() {
        return api.delete('/api/notifications/clear-all/');
    },
};

