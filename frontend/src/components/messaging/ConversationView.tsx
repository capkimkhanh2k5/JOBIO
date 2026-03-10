import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import type { MessageThreadDetail } from '@/types/api';
import { useUserStore } from '@/store/userStore';
import { useMessageStore } from '@/store/messageStore';
import { MessageBubble } from './MessageBubble';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Send, Paperclip, ChevronRight, Briefcase,
    Loader2, MessageSquareDashed, X, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Props {
    thread: MessageThreadDetail;
    onShowParticipants?: () => void;
}

function EmptyMessages() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center">
                <MessageSquareDashed className="w-8 h-8 text-violet-400" />
            </div>
            <div>
                <p className="font-semibold text-foreground">Chưa có tin nhắn nào</p>
                <p className="text-sm text-muted-foreground mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
        </div>
    );
}

export function ConversationView({ thread, onShowParticipants }: Props) {
    const [inputValue, setInputValue] = useState('');
    const [attachingFile, setAttachingFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const qc = useQueryClient();
    const { decrementUnread } = useMessageStore();
    const myId = useUserStore((s) => s.user?.id);

    // Fetch messages
    const { data, isLoading } = useQuery({
        queryKey: ['messages', thread.id],
        queryFn: () => messageService.listMessages(thread.id),
        staleTime: 10_000,
    });

    const messages = data?.results ?? [];

    // Mark read on mount/thread change
    useEffect(() => {
        if (thread.unread_count > 0) {
            messageService.markRead(thread.id).then(() => {
                decrementUnread(thread.unread_count);
                qc.invalidateQueries({ queryKey: ['message-threads'] });
            });
        }
    }, [thread.id, thread.unread_count, qc, decrementUnread]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (payload: { content: string; attachment_url?: string; attachment_name?: string }) =>
            messageService.sendMessage(thread.id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', thread.id] });
            qc.invalidateQueries({ queryKey: ['message-threads'] });
            setInputValue('');
            setAttachingFile(null);
        },
        onError: () => toast.error('Gửi tin nhắn thất bại. Thử lại!'),
    });

    // Delete message mutation
    const deleteMutation = useMutation({
        mutationFn: (msgId: number) => messageService.deleteMessage(msgId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', thread.id] }),
        onError: () => toast.error('Không thể xóa tin nhắn'),
    });

    const handleSend = async () => {
        const content = inputValue.trim();
        if (!content && !attachingFile) return;
        if (sendMutation.isPending) return;

        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;

        if (attachingFile) {
            setIsUploading(true);
            try {
                const result = await messageService.uploadAttachment(attachingFile);
                attachmentUrl = result.url;
                attachmentName = result.name;
            } catch {
                toast.error('Upload file thất bại!');
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        sendMutation.mutate({ content: content || `📎 ${attachingFile?.name}`, attachment_url: attachmentUrl, attachment_name: attachmentName });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error('File quá lớn! Tối đa 10MB.');
            return;
        }
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', 'application/x-rar-compressed'];
        if (!allowed.includes(file.type)) {
            toast.error('Loại file không được hỗ trợ!');
            return;
        }
        setAttachingFile(file);
    };

    const otherParticipants = thread.participants.filter(p => p.user.id !== myId);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-card/50 backdrop-blur-sm">
                <div className="min-w-0">
                    <h2 className="font-semibold text-foreground truncate text-base leading-tight">
                        {thread.subject || otherParticipants.map(p => p.user.full_name).join(', ')}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                            với{' '}
                            <span className="font-medium text-foreground">
                                {otherParticipants.map(p => p.user.full_name).join(', ')}
                            </span>
                        </span>
                        {thread.job && (
                            <>
                                <span className="text-muted-foreground/40">·</span>
                                <Badge variant="secondary" className="flex items-center gap-1 text-[10px] h-5">
                                    <Briefcase className="w-2.5 h-2.5" />
                                    Job #{thread.job}
                                </Badge>
                            </>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onShowParticipants}
                    aria-label="Xem thông tin người tham gia"
                >
                    Chi tiết
                    <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={`flex gap-2.5 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? 'w-56' : 'w-44'}`} />
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <EmptyMessages />
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwnMessage={msg.sender.id === myId}
                            onDelete={msg.sender.id === myId ? (id) => deleteMutation.mutate(id) : undefined}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview bar */}
            <AnimatePresence>
                {attachingFile && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 border-t border-border bg-muted/30 overflow-hidden"
                    >
                        <div className="flex items-center justify-between py-2.5 gap-3">
                            <div className="flex items-center gap-2 text-sm min-w-0">
                                <Paperclip className="w-4 h-4 text-violet-400 shrink-0" />
                                <span className="truncate font-medium text-foreground">{attachingFile.name}</span>
                                <span className="text-muted-foreground text-xs shrink-0">
                                    ({Math.round(attachingFile.size / 1024)} KB)
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setAttachingFile(null)}
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Separator />

            {/* Input area */}
            <div className="px-4 py-3 bg-card shrink-0">
                <div className="flex items-end gap-2.5 bg-muted/40 border border-border rounded-2xl px-4 py-2.5 focus-within:border-violet-400 focus-within:bg-background transition-all">
                    {/* File upload button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 shrink-0 mb-0.5 text-muted-foreground hover:text-violet-500 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Đính kèm file"
                        disabled={sendMutation.isPending || isUploading}
                    >
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                        onChange={handleFileChange}
                    />

                    {/* Textarea */}
                    <Textarea
                        placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm placeholder:text-muted-foreground/60"
                        disabled={sendMutation.isPending || isUploading}
                    />

                    {/* Send button */}
                    <Button
                        size="icon"
                        className="w-8 h-8 shrink-0 mb-0.5 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 hover:opacity-90 transition-opacity disabled:opacity-50"
                        onClick={handleSend}
                        disabled={(!inputValue.trim() && !attachingFile) || sendMutation.isPending || isUploading}
                        aria-label="Gửi tin nhắn"
                    >
                        {sendMutation.isPending || isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
                    File tối đa 10MB · jpg/png/gif/webp/pdf/doc/docx/xls/xlsx/zip/rar
                </p>
            </div>
        </div>
    );
}
