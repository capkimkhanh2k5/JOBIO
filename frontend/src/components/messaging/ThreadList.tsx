import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import type { MessageThread } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MessageSquareDashed, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
    selectedId: number | null;
    onSelectThread: (thread: MessageThread) => void;
    onNewThread: () => void;
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function ThreadSkeleton() {
    return (
        <div className="flex gap-3 px-3 py-3.5 border-b border-border/40">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    );
}

function EmptySearch({ query }: { query: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <MessageSquareDashed className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
                Không tìm thấy cuộc trò chuyện nào cho "<span className="font-semibold">{query}</span>"
            </p>
        </div>
    );
}

function formatTime(iso: string | null) {
    if (!iso) return '';
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: false, locale: vi });
    } catch {
        return '';
    }
}

export function ThreadList({ selectedId, onSelectThread, onNewThread }: Props) {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['message-threads', search],
        queryFn: () => messageService.listThreads({ search: search || undefined }),
        staleTime: 15_000,
        placeholderData: (prev) => prev,
    });

    const threads = useMemo(() => data?.results ?? [], [data]);
    const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

    return (
        <div className="flex flex-col h-full border-r border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-5 pb-3 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-violet-600" />
                        <h2 className="font-bold text-base text-slate-900">Tin nhắn</h2>
                        {totalUnread > 0 && (
                            <Badge className="bg-violet-500 text-white text-[10px] h-5 min-w-[20px] px-1.5 rounded-full">
                                {totalUnread}
                            </Badge>
                        )}
                    </div>
                    <Button
                        size="sm"
                        className="gap-1.5 h-8 text-xs rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20"
                        onClick={onNewThread}
                        aria-label="Tạo cuộc hội thoại mới"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tạo mới</span>
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                    <Input
                        placeholder="Tìm cuộc trò chuyện..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm bg-muted/40 border-border/50 rounded-xl focus-visible:ring-violet-400"
                    />
                </div>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <>{[...Array(5)].map((_, i) => <ThreadSkeleton key={i} />)}</>
                ) : threads.length === 0 ? (
                    <EmptySearch query={search} />
                ) : (
                    <AnimatePresence initial={false}>
                        {threads.map((thread, idx) => {
                            const isSelected = thread.id === selectedId;
                            const displayName = thread.subject || `Cuộc trò chuyện #${thread.id}`;

                            return (
                                <motion.button
                                    key={thread.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => onSelectThread(thread)}
                                    className={cn(
                                        'w-full text-left flex gap-3 px-4 py-3.5 border-b border-border/40 transition-all duration-150 relative group',
                                        isSelected
                                            ? 'bg-violet-50 dark:bg-violet-500/10'
                                            : 'hover:bg-muted/50'
                                    )}
                                    aria-label={`Cuộc trò chuyện với ${displayName}`}
                                >
                                    {/* Active indicator */}
                                    {isSelected && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-violet-600 rounded-r-full" />
                                    )}

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold bg-violet-500',
                                            isSelected ? 'bg-violet-600' : 'bg-slate-400'
                                        )}>
                                            {getInitials(displayName)}
                                        </div>
                                        {thread.unread_count > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                                {thread.unread_count > 9 ? '9+' : thread.unread_count}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className={cn(
                                                'text-sm truncate',
                                                thread.unread_count > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'
                                            )}>
                                                {displayName}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {formatTime(thread.last_message?.created_at ?? null)}
                                            </span>
                                        </div>

                                        <p className={cn(
                                            'text-xs truncate',
                                            thread.unread_count > 0 ? 'text-foreground/80' : 'text-muted-foreground'
                                        )}>
                                            {thread.last_message?.content ?? 'Chưa có tin nhắn'}
                                        </p>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
