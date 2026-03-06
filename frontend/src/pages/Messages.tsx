import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, type MockThread } from '@/services/messageService';
import { useMessageStore } from '@/store/messageStore';
import { ThreadList } from '@/components/messaging/ThreadList';
import { ConversationView } from '@/components/messaging/ConversationView';
import { ParticipantPanel } from '@/components/messaging/ParticipantPanel';
import { NewThreadDialog } from '@/components/messaging/NewThreadDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── No Thread Selected placeholder ─────────────────────────────────────────
function NoThreadSelected() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center select-none">
            {/* Aurora glow */}
            <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center ring-1 ring-violet-200 dark:ring-violet-500/30">
                    <MessageSquare className="w-10 h-10 text-violet-400" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400/10 to-cyan-400/10 blur-xl -z-10" />
            </div>
            <div className="max-w-xs">
                <h3 className="font-bold text-lg text-foreground">Chọn cuộc trò chuyện</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Chọn một thread ở bên trái để bắt đầu nhắn tin, hoặc tạo cuộc hội thoại mới.
                </p>
            </div>
        </div>
    );
}

// ─── Main MessagesPage ────────────────────────────────────────────────────────
export default function MessagesPage() {
    const { setSelectedThread } = useMessageStore();
    const [selectedThread, setSelectedThreadData] = useState<MockThread | null>(null);
    const [showParticipantPanel, setShowParticipantPanel] = useState(false);
    const [showNewThread, setShowNewThread] = useState(false);
    // Mobile: 'list' | 'conversation'
    const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list');

    const [searchParams, setSearchParams] = useSearchParams();
    const targetUserIdParam = searchParams.get('userId');
    const targetUserId = targetUserIdParam ? parseInt(targetUserIdParam, 10) : null;

    const qc = useQueryClient();
    const { setUnreadCount } = useMessageStore();

    // Initial unread count fetch
    useQuery({
        queryKey: ['message-unread-count'],
        queryFn: async () => {
            const result = await messageService.getUnreadCount();
            setUnreadCount(result.count);
            return result;
        },
        staleTime: 30_000,
    });

    // Fetch threads to check if we already have a conversation with the target user
    const { data: threadsData } = useQuery({
        queryKey: ['message-threads', ''],
        queryFn: () => messageService.listThreads(),
        staleTime: 15_000,
        enabled: !!targetUserId,
    });

    useEffect(() => {
        if (targetUserId && threadsData?.results) {
            // Check if thread exists with exactly this user (and us)
            const existingThread = threadsData.results.find(t =>
                t.participants.length === 2 && t.participants.some(p => p.id === targetUserId)
            );

            if (existingThread) {
                // If exists, select it
                if (selectedThread?.id !== existingThread.id) {
                    handleSelectThread(existingThread);
                }
            } else {
                // If not exists, open NewThreadDialog with this user pre-selected
                if (!showNewThread) {
                    setShowNewThread(true);
                }
            }

            // Clean up the URL parameter so it doesn't trigger again on re-renders
            setSearchParams({});
        }
    }, [targetUserId, threadsData, selectedThread, showNewThread, setSearchParams]);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => messageService.deleteThread(id),
        onSuccess: () => {
            toast.success('Đã xóa cuộc trò chuyện');
            setSelectedThreadData(null);
            setSelectedThread(null);
            setMobileView('list');
            qc.invalidateQueries({ queryKey: ['message-threads'] });
        },
        onError: () => toast.error('Không thể xóa cuộc trò chuyện'),
    });

    const handleSelectThread = (thread: MockThread) => {
        setSelectedThreadData(thread);
        setSelectedThread(thread.id);
        setMobileView('conversation');
        // Close participant panel on new thread select
        setShowParticipantPanel(false);
    };

    const handleNewCreated = (threadId: number) => {
        // After creating a thread, re-fetch threads then select the new one
        qc.invalidateQueries({ queryKey: ['message-threads'] }).then(async () => {
            const thread = await messageService.getThread(threadId);
            handleSelectThread(thread);
        });
    };

    return (
        <div className="h-full flex overflow-hidden bg-background">
            {/* ─── LEFT PANEL: Thread List ────────────────────────────────────────── */}
            {/* On mobile: full width when mobileView==='list', hidden when 'conversation' */}
            {/* On md+: always visible with fixed width */}
            <div
                className={`
          flex-col bg-card
          w-full md:w-[300px] lg:w-[320px] xl:w-[340px] 
          shrink-0 md:flex
          ${mobileView === 'list' ? 'flex' : 'hidden'}
        `}
            >
                <ThreadList
                    selectedId={selectedThread?.id ?? null}
                    onSelectThread={handleSelectThread}
                    onNewThread={() => setShowNewThread(true)}
                />
            </div>

            {/* ─── CENTER PANEL: Conversation ──────────────────────────────────────── */}
            <div
                className={`
          flex-1 flex flex-col bg-background min-w-0
          ${mobileView === 'conversation' ? 'flex' : 'hidden md:flex'}
        `}
            >
                {/* Mobile back button */}
                <div className="md:hidden px-4 py-2 border-b border-border shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                        onClick={() => {
                            setMobileView('list');
                            setSelectedThreadData(null);
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    {selectedThread ? (
                        <motion.div
                            key={selectedThread.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <ConversationView
                                thread={selectedThread}
                                onShowParticipants={() => setShowParticipantPanel(v => !v)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex"
                        >
                            <NoThreadSelected />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── RIGHT PANEL: Participant Info (xl only, collapsible) ─────────────── */}
            <AnimatePresence>
                {showParticipantPanel && selectedThread && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="shrink-0 overflow-hidden hidden lg:block"
                    >
                        <ParticipantPanel
                            thread={selectedThread}
                            onClose={() => setShowParticipantPanel(false)}
                            onDeleteThread={(id) => deleteMutation.mutate(id)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── New Thread Dialog ────────────────────────────────────────────────── */}
            <NewThreadDialog
                open={showNewThread}
                onOpenChange={setShowNewThread}
                onCreated={handleNewCreated}
                defaultSelectedUser={targetUserId || undefined}
            />
        </div>
    );
}
