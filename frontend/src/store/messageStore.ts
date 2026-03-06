// ─── Message Store (Zustand) ─────────────────────────────────────────────────
// Manages unread count badge + selected thread UI state.

import { create } from 'zustand';

export interface MessageState {
    unreadCount: number;
    setUnreadCount: (n: number) => void;
    decrementUnread: (by: number) => void;
    selectedThreadId: number | null;
    setSelectedThread: (id: number | null) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
    unreadCount: 0,
    setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
    decrementUnread: (by) => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),
    selectedThreadId: null,
    setSelectedThread: (id) => set({ selectedThreadId: id }),
}));
