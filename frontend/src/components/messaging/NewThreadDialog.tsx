import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Check, Users, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (threadId: number) => void;
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function NewThreadDialog({ open, onOpenChange, onCreated }: Props) {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const qc = useQueryClient();

    const { data: recipients, isLoading: loadingRecipients } = useQuery({
        queryKey: ['message-available-recipients'],
        queryFn: () => messageService.listAvailableRecipients(),
        staleTime: 60_000,
        enabled: open,
    });

    const createMutation = useMutation({
        mutationFn: () =>
            messageService.createThread({
                subject: subject.trim() || undefined,
                participant_ids: selectedIds,
                content: content.trim(),
            }),
        onSuccess: (thread) => {
            toast.success('Đã tạo cuộc trò chuyện!');
            qc.invalidateQueries({ queryKey: ['message-threads'] });
            onCreated(thread.id);
            handleClose();
        },
        onError: () => toast.error('Không thể tạo cuộc trò chuyện. Thử lại!'),
    });

    const handleClose = () => {
        setSubject('');
        setContent('');
        setSelectedIds([]);
        onOpenChange(false);
    };

    const toggleRecipient = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const canSubmit = selectedIds.length > 0 && content.trim().length > 0 && !createMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg bg-card border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        Tạo cuộc hội thoại mới
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Recipients */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                            Người nhận <span className="text-destructive">*</span>
                        </Label>

                        {/* Selected chips */}
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-wrap gap-1.5"
                                >
                                    {selectedIds.map(id => {
                                        const r = recipients?.find(p => p.id === id);
                                        if (!r) return null;
                                        return (
                                            <Badge
                                                key={id}
                                                variant="secondary"
                                                className="gap-1.5 pr-1 text-xs bg-violet-100 text-violet-700 border-violet-200"
                                            >
                                                {r.full_name}
                                                <button
                                                    onClick={() => toggleRecipient(id)}
                                                    className="w-4 h-4 rounded-full hover:bg-violet-200 flex items-center justify-center"
                                                    aria-label={`Bỏ chọn ${r.full_name}`}
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Recipient list */}
                        <div className="border border-border rounded-xl overflow-hidden bg-muted/30 max-h-[160px] overflow-y-auto">
                            {loadingRecipients ? (
                                <div className="py-6 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                </div>
                            ) : (recipients ?? []).length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-6">Không có người dùng nào</p>
                            ) : (
                                (recipients ?? []).map(r => {
                                    const isSelected = selectedIds.includes(r.id);
                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => toggleRecipient(r.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/30 last:border-b-0 ${isSelected ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-muted/60'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {getInitials(r.full_name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{r.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground">{r.role === 'company' ? 'Nhà tuyển dụng' : 'Ứng viên'}</p>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-violet-500 shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Subject (optional) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="thread-subject" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                            Chủ đề <span className="text-muted-foreground/50 font-normal">(tùy chọn)</span>
                        </Label>
                        <Input
                            id="thread-subject"
                            placeholder="VD: Cơ hội Frontend Engineer tại TechCorp"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="h-9 text-sm border-border/70 focus-visible:ring-violet-400"
                        />
                    </div>

                    {/* First message */}
                    <div className="space-y-1.5">
                        <Label htmlFor="thread-message" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                            Tin nhắn đầu tiên <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="thread-message"
                            placeholder="Nhập nội dung tin nhắn..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={4}
                            className="text-sm resize-none border-border/70 focus-visible:ring-violet-400"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
                        Hủy
                    </Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={!canSubmit}
                        className="gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:opacity-90 text-white"
                    >
                        {createMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                        ) : (
                            'Gửi tin nhắn'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
