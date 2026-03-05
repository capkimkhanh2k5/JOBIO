import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService, type MockThread, type MockParticipant } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Briefcase, X, UserPlus, UserMinus, Trash2, ChevronDown, ChevronUp,
    ExternalLink, Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MOCK_MY_ID = 1;

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function ParticipantAvatar({ p, size = 'md' }: { p: MockParticipant; size?: 'sm' | 'md' | 'lg' }) {
    const cls = size === 'lg' ? 'w-12 h-12 text-sm' : size === 'md' ? 'w-10 h-10 text-xs' : 'w-8 h-8 text-[10px]';
    return (
        <div className={`${cls} rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0`}>
            {getInitials(p.full_name)}
        </div>
    );
}

interface Props {
    thread: MockThread;
    onClose: () => void;
    onDeleteThread: (id: number) => void;
}

export function ParticipantPanel({ thread, onClose, onDeleteThread }: Props) {
    const [showActions, setShowActions] = useState(false);
    const qc = useQueryClient();

    const { data: recipients } = useQuery({
        queryKey: ['message-available-recipients'],
        queryFn: () => messageService.listAvailableRecipients(),
        staleTime: 60_000,
    });

    const addMutation = useMutation({
        mutationFn: (userId: number) => messageService.addParticipant(thread.id, userId),
        onSuccess: () => {
            toast.success('Đã thêm người tham gia!');
            qc.invalidateQueries({ queryKey: ['message-threads'] });
        },
        onError: () => toast.error('Không thể thêm người tham gia'),
    });

    const removeMutation = useMutation({
        mutationFn: (userId: number) => messageService.removeParticipant(thread.id, userId),
        onSuccess: () => {
            toast.success('Đã xóa người tham gia');
            qc.invalidateQueries({ queryKey: ['message-threads'] });
        },
        onError: () => toast.error('Không thể xóa người tham gia'),
    });

    const canAddParticipants = recipients?.filter(
        r => !thread.participants.find(p => p.id === r.id)
    ) ?? [];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full bg-card border-l border-border overflow-y-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-violet-500" />
                    <h3 className="font-semibold text-sm text-foreground">Chi tiết cuộc trò chuyện</h3>
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose} aria-label="Đóng">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="px-4 py-5 space-y-6 flex-1">
                {/* Subject */}
                {thread.subject && (
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Chủ đề</p>
                        <p className="text-sm font-medium text-foreground">{thread.subject}</p>
                    </div>
                )}

                {/* Job link */}
                {thread.job_title && (
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Vị trí liên quan</p>
                        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 border border-border">
                            <Briefcase className="w-4 h-4 text-cyan-500 shrink-0" />
                            <span className="text-sm font-medium text-foreground flex-1 truncate">{thread.job_title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </div>
                )}

                {/* Created */}
                <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Tạo lúc</p>
                    <p className="text-sm text-foreground">
                        {format(new Date(thread.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                </div>

                <Separator />

                {/* Participants */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                            Người tham gia ({thread.participants.length})
                        </p>
                        {canAddParticipants.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-6 h-6 text-violet-500" aria-label="Thêm người">
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                {canAddParticipants.map(r => (
                                                    <DropdownMenuItem
                                                        key={r.id}
                                                        onClick={() => addMutation.mutate(r.id)}
                                                        className="gap-2 text-sm"
                                                    >
                                                        <ParticipantAvatar p={r} size="sm" />
                                                        {r.full_name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TooltipTrigger>
                                    <TooltipContent>Thêm người tham gia</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    <div className="space-y-2">
                        {thread.participants.map(p => (
                            <div key={p.id} className="flex items-center gap-3 group">
                                <ParticipantAvatar p={p} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{p.full_name}</p>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 mt-0.5">
                                        {p.role === 'company' ? 'NTD' : 'Ứng viên'}
                                    </Badge>
                                </div>
                                {p.id !== MOCK_MY_ID && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                        onClick={() => removeMutation.mutate(p.id)}
                                        aria-label={`Xóa ${p.full_name} khỏi cuộc trò chuyện`}
                                    >
                                        <UserMinus className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Danger zone */}
                <div>
                    <button
                        onClick={() => setShowActions(v => !v)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2 hover:text-foreground transition-colors"
                    >
                        Hành động khác
                        {showActions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showActions && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                    if (confirm('Xóa cuộc trò chuyện này? Không thể hoàn tác!')) {
                                        onDeleteThread(thread.id);
                                    }
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa cuộc trò chuyện
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
