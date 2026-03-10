// ─── Message Service – Real API ─────────────────────────────────────────────
import api from './api';
import type {
    MessageThread,
    MessageThreadDetail,
    MessageParticipantUser,
    Message,
    PaginatedResponse,
} from '@/types/api';

// ─── Service ──────────────────────────────────────────────────────────────────

export const messageService = {
    /** GET /api/messages/threads/ */
    async listThreads(params?: { search?: string; page?: number; page_size?: number }) {
        const { data } = await api.get<PaginatedResponse<MessageThread>>('/api/messages/threads/', { params });
        return data;
    },

    /** GET /api/messages/threads/:id/ (detail — includes participants) */
    async getThread(id: number) {
        const { data } = await api.get<MessageThreadDetail>(`/api/messages/threads/${id}/`);
        return data;
    },

    /** POST /api/messages/threads/ */
    async createThread(payload: {
        subject?: string;
        participant_ids: number[];
        job_id?: number | null;
        content: string;
    }) {
        const { data } = await api.post<MessageThreadDetail>('/api/messages/threads/', payload);
        return data;
    },

    /** DELETE /api/messages/threads/:id/ */
    async deleteThread(id: number) {
        await api.delete(`/api/messages/threads/${id}/`);
    },

    /** GET /api/messages/threads/:id/messages/ */
    async listMessages(threadId: number, params?: { page?: number; page_size?: number }) {
        const { data } = await api.get<PaginatedResponse<Message>>(`/api/messages/threads/${threadId}/messages/`, { params });
        return data;
    },

    /** POST /api/messages/threads/:id/messages/ */
    async sendMessage(threadId: number, payload: { content: string; attachment_url?: string }) {
        const { data } = await api.post<Message>(`/api/messages/threads/${threadId}/messages/`, payload);
        return data;
    },

    /** PATCH /api/messages/threads/:id/read/ */
    async markRead(threadId: number) {
        await api.patch(`/api/messages/threads/${threadId}/read/`);
    },

    /** DELETE /api/messages/:id/ */
    async deleteMessage(messageId: number) {
        await api.delete(`/api/messages/${messageId}/`);
    },

    /** GET /api/messages/unread-count/ */
    async getUnreadCount(): Promise<{ count: number }> {
        const { data } = await api.get<{ count: number }>('/api/messages/unread-count/');
        return data;
    },

    /** POST /api/messages/upload-attachment/ */
    async uploadAttachment(file: File): Promise<{ url: string; name: string; size: number }> {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post<{ url: string; name: string; size: number }>(
            '/api/messages/upload-attachment/',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data;
    },

    /** POST /api/messages/threads/:id/participants/ */
    async addParticipant(threadId: number, userId: number) {
        await api.post(`/api/messages/threads/${threadId}/participants/`, { user_id: userId });
    },

    /** DELETE /api/messages/threads/:id/participants/:uid/ */
    async removeParticipant(threadId: number, userId: number) {
        await api.delete(`/api/messages/threads/${threadId}/participants/${userId}/`);
    },

    /** GET available recipients for new thread */
    async listAvailableRecipients(): Promise<MessageParticipantUser[]> {
        const { data } = await api.get<MessageParticipantUser[]>('/api/messages/recipients/');
        return data;
    },
};
