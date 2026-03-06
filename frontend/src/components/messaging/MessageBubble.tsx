import { type MockMessage, type MockParticipant } from '@/services/messageService';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Paperclip, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Props {
    message: MockMessage;
    isOwnMessage: boolean;
    onDelete?: (id: number) => void;
}

function formatMessageTime(iso: string) {
    const d = new Date(iso);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return `Hôm qua ${format(d, 'HH:mm')}`;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function AvatarFallback({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
    const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    return (
        <div
            className={`${cls} rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0`}
        >
            {getInitials(name)}
        </div>
    );
}

function AttachmentPreview({ message }: { message: MockMessage }) {
    if (!message.attachment_url) return null;
    const isPdf = message.attachment_name?.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachment_name ?? '');
    const sizeKb = message.attachment_size ? Math.round(message.attachment_size / 1024) : null;

    if (isImage) {
        return (
            <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block max-w-[200px] rounded-xl overflow-hidden border border-white/20 hover:opacity-90 transition-opacity"
            >
                <img src={message.attachment_url} alt={message.attachment_name ?? 'Ảnh đính kèm'} className="w-full object-cover" />
            </a>
        );
    }

    return (
        <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2.5 max-w-[260px]"
        >
            {isPdf ? (
                <FileText className="w-5 h-5 shrink-0 text-red-300" />
            ) : (
                <Paperclip className="w-5 h-5 shrink-0 text-slate-300" />
            )}
            <div className="min-w-0">
                <p className="text-xs font-medium truncate">{message.attachment_name}</p>
                {sizeKb && <p className="text-[10px] opacity-70">{sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}</p>}
            </div>
        </a>
    );
}

export function MessageBubble({ message, isOwnMessage, onDelete }: Props) {
    if (message.is_system_message) {
        return (
            <div className="flex justify-center my-2">
                <span className="text-xs text-muted-foreground bg-muted/60 rounded-full px-4 py-1">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-2.5 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            {!isOwnMessage && <AvatarFallback name={message.sender.full_name} size="sm" />}

            {/* Bubble */}
            <div className={`flex flex-col max-w-[72%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {/* Sender name (only for received) */}
                {!isOwnMessage && (
                    <span className="text-[11px] font-semibold text-muted-foreground px-1 mb-1">
                        {message.sender.full_name}
                    </span>
                )}

                <div
                    className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
            ${isOwnMessage
                            ? 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white rounded-tr-sm'
                            : 'bg-card border border-border text-foreground rounded-tl-sm'
                        }`}
                >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <AttachmentPreview message={message} />
                </div>

                {/* Timestamp + delete */}
                <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-muted-foreground">{formatMessageTime(message.created_at)}</span>
                    {isOwnMessage && onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(message.id)}
                            aria-label="Xóa tin nhắn"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Own avatar */}
            {isOwnMessage && <AvatarFallback name={message.sender.full_name} size="sm" />}
        </motion.div>
    );
}

export { AvatarFallback, getInitials };
export type { MockParticipant };
