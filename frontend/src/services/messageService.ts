// ─── Message Service – MOCK (Task 5.2) ─────────────────────────────────────
// All data is simulated locally. Replace BASE_URL calls with real axios when backend is ready.

export interface MockParticipant {
    id: number;
    full_name: string;
    avatar_url: string | null;
    role: 'candidate' | 'company' | 'admin';
}

export interface MockThread {
    id: number;
    subject: string | null;
    participants: MockParticipant[];
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
    job_id: number | null;
    job_title: string | null;
    created_at: string;
}

export interface MockMessage {
    id: number;
    thread_id: number;
    sender: MockParticipant;
    content: string;
    attachment_url: string | null;
    attachment_name: string | null;
    attachment_size: number | null;
    is_system_message: boolean;
    created_at: string;
}

export interface MockUnreadCount {
    count: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ME: MockParticipant = {
    id: 1,
    full_name: 'Nguyễn Văn An',
    avatar_url: null,
    role: 'candidate',
};

const MOCK_PARTICIPANTS: MockParticipant[] = [
    MOCK_ME,
    { id: 2, full_name: 'Trần Thị Hoa', avatar_url: null, role: 'company' },
    { id: 3, full_name: 'Lê Minh Tuấn', avatar_url: null, role: 'company' },
    { id: 4, full_name: 'Phạm Thu Hà', avatar_url: null, role: 'candidate' },
    { id: 5, full_name: 'Hoàng Đức Mạnh', avatar_url: null, role: 'company' },
];

let mockThreads: MockThread[] = [
    {
        id: 1,
        subject: 'Cơ hội Frontend Engineer tại TechCorp',
        participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1]],
        last_message_content: 'Cảm ơn bạn đã quan tâm! Chúng tôi rất muốn mời bạn phỏng vấn.',
        last_message_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        unread_count: 2,
        job_id: 101,
        job_title: 'Frontend Engineer',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        id: 2,
        subject: 'Hỏi về vị trí Senior React Developer',
        participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[2]],
        last_message_content: 'Mức lương thỏa thuận bạn mong muốn là bao nhiêu?',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
        unread_count: 1,
        job_id: 102,
        job_title: 'Senior React Developer',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
        id: 3,
        subject: 'Thông tin dự án Fintech Q2 2025',
        participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[3]],
        last_message_content: 'Bạn có thể bắt đầu vào ngày 1 tháng 4 không?',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        unread_count: 0,
        job_id: null,
        job_title: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
        id: 4,
        subject: 'Lời mời ứng tuyển – Product Designer',
        participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[4]],
        last_message_content: 'Hi! Mình thấy hồ sơ của bạn rất phù hợp với vị trí này.',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        unread_count: 0,
        job_id: 104,
        job_title: 'Product Designer',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
];

let mockMessages: Record<number, MockMessage[]> = {
    1: [
        {
            id: 101,
            thread_id: 1,
            sender: MOCK_PARTICIPANTS[1],
            content: 'Xin chào Nguyễn Văn An! Chúng tôi đã xem qua hồ sơ của bạn và rất ấn tượng với kinh nghiệm Frontend.',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
            id: 102,
            thread_id: 1,
            sender: MOCK_PARTICIPANTS[0],
            content: 'Cảm ơn! Tôi rất quan tâm đến vị trí này. Bạn có thể cho tôi biết thêm về dự án không?',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
            id: 103,
            thread_id: 1,
            sender: MOCK_PARTICIPANTS[1],
            content: 'Cảm ơn bạn đã quan tâm! Chúng tôi rất muốn mời bạn phỏng vấn. Bạn có rảnh vào thứ Tư tuần này không?',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
    ],
    2: [
        {
            id: 201,
            thread_id: 2,
            sender: MOCK_PARTICIPANTS[2],
            content: 'Chào bạn, tôi đang tìm kiếm Senior React Developer có kinh nghiệm với TypeScript và Next.js.',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        },
        {
            id: 202,
            thread_id: 2,
            sender: MOCK_PARTICIPANTS[0],
            content: 'Xin chào! Tôi có 4 năm kinh nghiệm với React và 2 năm với TypeScript. Rất vui được trao đổi thêm.',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        },
        {
            id: 203,
            thread_id: 2,
            sender: MOCK_PARTICIPANTS[2],
            content: 'Mức lương thỏa thuận bạn mong muốn là bao nhiêu?',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
        },
    ],
    3: [
        {
            id: 301,
            thread_id: 3,
            sender: MOCK_PARTICIPANTS[3],
            content: 'Chào An, đây là thông tin về dự án Fintech Q2 2025 của chúng tôi.',
            attachment_url: '/mock/fintech-project-brief.pdf',
            attachment_name: 'Fintech-Q2-2025-Brief.pdf',
            attachment_size: 2048000,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        },
        {
            id: 302,
            thread_id: 3,
            sender: MOCK_PARTICIPANTS[0],
            content: 'Cảm ơn! Tôi đã đọc qua brief. Dự án rất thú vị. Tôi muốn hỏi thêm về tech stack.',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        },
        {
            id: 303,
            thread_id: 3,
            sender: MOCK_PARTICIPANTS[3],
            content: 'Bạn có thể bắt đầu vào ngày 1 tháng 4 không?',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
    ],
    4: [
        {
            id: 401,
            thread_id: 4,
            sender: MOCK_PARTICIPANTS[4],
            content: 'Hi! Mình thấy hồ sơ của bạn rất phù hợp với vị trí Product Designer tại công ty chúng mình.',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30).toISOString(),
        },
        {
            id: 402,
            thread_id: 4,
            sender: MOCK_PARTICIPANTS[0],
            content: 'Cảm ơn bạn! Tôi sẽ xem xét và phản hồi sớm nhé.',
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
    ],
};

let nextMessageId = 500;
let nextThreadId = 10;

// ─── Utility ──────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Service ──────────────────────────────────────────────────────────────────

export const messageService = {
    /** GET /api/messages/threads/ */
    async listThreads(params?: { search?: string; page?: number; page_size?: number }) {
        await delay(rnd(300, 600));
        let results = [...mockThreads].sort(
            (a, b) => new Date(b.last_message_at ?? b.created_at).getTime() - new Date(a.last_message_at ?? a.created_at).getTime()
        );
        if (params?.search) {
            const q = params.search.toLowerCase();
            results = results.filter(
                t =>
                    t.subject?.toLowerCase().includes(q) ||
                    t.participants.some(p => p.full_name.toLowerCase().includes(q)) ||
                    t.last_message_content?.toLowerCase().includes(q)
            );
        }
        return { count: results.length, results };
    },

    /** GET /api/messages/threads/:id/ */
    async getThread(id: number) {
        await delay(rnd(200, 400));
        const thread = mockThreads.find(t => t.id === id);
        if (!thread) throw new Error('Thread not found');
        return thread;
    },

    /** POST /api/messages/threads/ */
    async createThread(data: {
        subject?: string;
        participant_ids: number[];
        job_id?: number | null;
        content: string;
    }) {
        await delay(rnd(400, 700));
        const newThread: MockThread = {
            id: nextThreadId++,
            subject: data.subject || null,
            participants: [MOCK_ME, ...MOCK_PARTICIPANTS.filter(p => data.participant_ids.includes(p.id))],
            last_message_content: data.content,
            last_message_at: new Date().toISOString(),
            unread_count: 0,
            job_id: data.job_id ?? null,
            job_title: null,
            created_at: new Date().toISOString(),
        };
        mockThreads = [newThread, ...mockThreads];
        mockMessages[newThread.id] = [
            {
                id: nextMessageId++,
                thread_id: newThread.id,
                sender: MOCK_ME,
                content: data.content,
                attachment_url: null,
                attachment_name: null,
                attachment_size: null,
                is_system_message: false,
                created_at: new Date().toISOString(),
            },
        ];
        return newThread;
    },

    /** DELETE /api/messages/threads/:id/ */
    async deleteThread(id: number) {
        await delay(rnd(300, 500));
        mockThreads = mockThreads.filter(t => t.id !== id);
        delete mockMessages[id];
    },

    /** GET /api/messages/threads/:id/messages/ */
    async listMessages(threadId: number, _params?: { page?: number; page_size?: number }) {
        await delay(rnd(300, 600));
        const msgs = mockMessages[threadId] ?? [];
        return { count: msgs.length, results: msgs };
    },

    /** POST /api/messages/threads/:id/messages/ */
    async sendMessage(threadId: number, data: { content: string; attachment_url?: string; attachment_name?: string }) {
        await delay(rnd(200, 400));
        const newMsg: MockMessage = {
            id: nextMessageId++,
            thread_id: threadId,
            sender: MOCK_ME,
            content: data.content,
            attachment_url: data.attachment_url ?? null,
            attachment_name: data.attachment_name ?? null,
            attachment_size: null,
            is_system_message: false,
            created_at: new Date().toISOString(),
        };
        if (!mockMessages[threadId]) mockMessages[threadId] = [];
        mockMessages[threadId].push(newMsg);
        // Update thread last message
        mockThreads = mockThreads.map(t =>
            t.id === threadId
                ? { ...t, last_message_content: data.content, last_message_at: newMsg.created_at }
                : t
        );
        return newMsg;
    },

    /** PATCH /api/messages/threads/:id/read/ */
    async markRead(threadId: number) {
        await delay(rnd(100, 250));
        mockThreads = mockThreads.map(t =>
            t.id === threadId ? { ...t, unread_count: 0 } : t
        );
    },

    /** DELETE /api/messages/:id/ */
    async deleteMessage(messageId: number) {
        await delay(rnd(200, 400));
        for (const threadId in mockMessages) {
            mockMessages[Number(threadId)] = mockMessages[Number(threadId)].filter(m => m.id !== messageId);
        }
    },

    /** GET /api/messages/unread-count/ */
    async getUnreadCount(): Promise<MockUnreadCount> {
        await delay(rnd(150, 300));
        const count = mockThreads.reduce((sum, t) => sum + t.unread_count, 0);
        return { count };
    },

    /** POST /api/messages/upload-attachment/ (simulated) */
    async uploadAttachment(file: File): Promise<{ url: string; name: string; size: number }> {
        await delay(rnd(500, 1200));
        // Simulate upload – return a fake URL
        return {
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
        };
    },

    /** POST /api/messages/threads/:id/participants/ */
    async addParticipant(threadId: number, userId: number) {
        await delay(rnd(300, 500));
        const participant = MOCK_PARTICIPANTS.find(p => p.id === userId);
        if (!participant) throw new Error('User not found');
        mockThreads = mockThreads.map(t =>
            t.id === threadId && !t.participants.find(p => p.id === userId)
                ? { ...t, participants: [...t.participants, participant] }
                : t
        );
    },

    /** DELETE /api/messages/threads/:id/participants/:user_id/ */
    async removeParticipant(threadId: number, userId: number) {
        await delay(rnd(200, 400));
        mockThreads = mockThreads.map(t =>
            t.id === threadId
                ? { ...t, participants: t.participants.filter(p => p.id !== userId) }
                : t
        );
    },

    /** Available recipients for new thread */
    async listAvailableRecipients(): Promise<MockParticipant[]> {
        await delay(rnd(200, 400));
        return MOCK_PARTICIPANTS.filter(p => p.id !== MOCK_ME.id);
    },
};
