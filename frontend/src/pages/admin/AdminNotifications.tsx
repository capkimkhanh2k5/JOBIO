import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import {
    Bell, CheckCheck, Trash2, FileText, Calendar,
    AlertTriangle, ShieldCheck, BellOff,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    application: { label: 'Ứng tuyển', icon: <FileText className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    interview: { label: 'Phỏng vấn', icon: <Calendar className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
    report: { label: 'Vi phạm', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    warning: { label: 'Cảnh báo', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    verification: { label: 'Xác minh', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    system: { label: 'Hệ thống', icon: <Bell className="w-5 h-5" />, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
    job_alert: { label: 'Việc làm', icon: <Bell className="w-5 h-5" />, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
};

const getMeta = (type: string) => TYPE_META[type] ?? TYPE_META.system;

const TABS = [
    { key: 'all', label: 'Tất cả', icon: Bell },
    { key: 'unread', label: 'Chưa đọc', icon: BellOff },
    { key: 'report', label: 'Vi phạm', icon: AlertTriangle },
    { key: 'verification', label: 'Xác minh', icon: ShieldCheck },
    { key: 'system', label: 'Hệ thống', icon: FileText },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { markAllAsRead: markAllStore, fetchUnreadCount } = useNotificationStore();

    // ── Build query params ──────────────────────────────────────────────────
    const queryParams = (() => {
        const p: Record<string, any> = { page_size: 15, page };
        if (activeTab === 'unread') p.is_read = false;
        if (['report', 'verification', 'system'].includes(activeTab)) p.type = activeTab;
        return p;
    })();

    // ── Data fetching ────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['admin-notifications', activeTab, page],
        queryFn: () => notificationService.listAdminNotifications(queryParams).then(r => r.data),
        staleTime: 30_000,
    });

    const notifications: any[] = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount / 15) || 1;
    const unreadCount = activeTab === 'all'
        ? notifications.filter(n => !n.is_read).length
        : totalCount;

    // ── Mutations ─────────────────────────────────────────────────────────────
    const markReadMut = useMutation({
        mutationFn: (id: number) => notificationService.markAdminNotificationRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            fetchUnreadCount();
        },
    });

    const markAllMut = useMutation({
        mutationFn: () => {
            const ids = notifications.filter(n => !n.is_read).map(n => n.id);
            if (ids.length === 0) return Promise.resolve();
            return notificationService.bulkMarkAdminNotificationsRead(ids);
        },
        onSuccess: () => {
            markAllStore();
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            toast.success('Hộp thư đã được cập nhật');
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: number) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            toast.success('Đã xóa thông báo');
        },
    });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleItemClick = (notif: any) => {
        if (!notif.is_read) markReadMut.mutate(notif.id);
        if (notif.link) navigate(notif.link);
    };

    const handleTabChange = (key: TabKey) => {
        setActiveTab(key);
        setPage(1);
    };

    const fadeUp = (delay: number) => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1 bg-slate-50/30 min-h-screen">
            {/* ── Page Header ── */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Bell className="w-6 h-6 text-violet-600" />
                        Quản lý Thông báo
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Hệ thống giám sát và quản lý thông báo toàn nền tảng.</p>
                </div>

                <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tình trạng</p>
                        <p className="text-sm font-black text-slate-900">
                            {totalCount.toLocaleString()} <span className="text-slate-500 font-medium ml-1">tin nhắn</span>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ── Filter & Search Bar ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center p-1 bg-white rounded-2xl w-full sm:w-fit border border-slate-200 shadow-sm">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={cn(
                                    'flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2',
                                    isActive
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        className={cn(
                            "h-11 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 gap-2",
                            unreadCount === 0 && "opacity-50 grayscale cursor-not-allowed"
                        )}
                        onClick={() => unreadCount > 0 && markAllMut.mutate()}
                        disabled={markAllMut.isPending || unreadCount === 0}
                    >
                        <CheckCheck className="w-5 h-5" />
                        Đánh dấu đã đọc tất cả
                    </Button>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[650px] flex flex-col">
                <div className="flex-1">
                    {isLoading ? (
                        <div className="divide-y divide-slate-100">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-8 p-8 animate-pulse">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-4 py-2">
                                        <div className="h-5 bg-slate-50 rounded w-1/4" />
                                        <div className="h-5 bg-slate-50 rounded w-full" />
                                        <div className="h-4 bg-slate-50 rounded w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-52 text-center px-12">
                            <div className="w-32 h-32 rounded-[3rem] bg-slate-50 flex items-center justify-center mb-8 border border-dashed border-slate-200">
                                <BellOff className="w-14 h-14 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Hộp thư sạch sẽ</h3>
                            <p className="text-slate-400 max-w-sm leading-relaxed font-bold text-base">
                                {activeTab === 'unread'
                                    ? 'Hiện tại chưa có thông báo mới.'
                                    : 'Hiện tại chưa có thông báo.'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout" initial={false}>
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif: any, i: number) => {
                                    const typeName = notif.notification_type?.type_name ?? notif.type ?? 'system';
                                    const meta = getMeta(typeName);
                                    const isUnread = !notif.is_read;

                                    return (
                                        <motion.div
                                            key={notif.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}
                                            className={cn(
                                                'group flex items-start gap-8 px-10 py-8 cursor-pointer transition-all duration-300 relative border-l-[6px] border-transparent',
                                                isUnread ? 'bg-violet-50/20 border-l-violet-600' : 'hover:bg-slate-50/40'
                                            )}
                                            onClick={() => handleItemClick(notif)}
                                        >
                                            <div className={cn(
                                                'flex-shrink-0 w-16 h-16 rounded-2xl border-2 flex items-center justify-center shadow-sm transition-all duration-500',
                                                meta.bg,
                                                isUnread ? 'border-violet-100 shadow-violet-100' : 'border-white opacity-50 grayscale'
                                            )}>
                                                <div className={cn('scale-110', meta.color)}>{meta.icon}</div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-6 mb-3">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <span className={cn(
                                                            'text-lg tracking-tight transition-colors duration-300',
                                                            isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-500'
                                                        )}>
                                                            {notif.title}
                                                        </span>
                                                        <Badge className={cn(
                                                            'px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 shadow-none',
                                                            meta.bg, meta.color,
                                                            isUnread ? 'border-violet-100' : 'border-transparent opacity-50'
                                                        )}>
                                                            {meta.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 whitespace-nowrap bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                                    </div>
                                                </div>

                                                <p className={cn(
                                                    'text-base leading-relaxed line-clamp-2 mb-5 transition-colors duration-300',
                                                    isUnread ? 'text-slate-700 font-bold' : 'text-slate-400 font-medium'
                                                )}>
                                                    {notif.content ?? notif.message}
                                                </p>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        #{notif.id}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                                        {format(new Date(notif.created_at), 'HH:mm · dd LMMM yyyy', { locale: vi })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-6 group-hover:translate-x-0">
                                                {isUnread && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); markReadMut.mutate(notif.id); }}
                                                    >
                                                        <CheckCheck className="w-6 h-6" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                    onClick={(e) => { e.stopPropagation(); deleteMut.mutate(notif.id); }}
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </AnimatePresence>
                    )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-violet-600 shadow-lg shadow-violet-200" />
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                                Trang {page} / {totalPages}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                disabled={page === 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="h-12 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-black gap-3 shadow-sm transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Trước
                            </Button>

                            <div className="flex items-center gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={cn(
                                            'w-12 h-12 rounded-2xl text-sm font-black transition-all duration-300',
                                            page === i + 1
                                                ? 'bg-violet-600 text-white shadow-2xl shadow-violet-300 scale-110'
                                                : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200'
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="lg"
                                disabled={page === totalPages || isLoading}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="h-12 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-black gap-3 shadow-sm transition-all"
                            >
                                Sau
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
