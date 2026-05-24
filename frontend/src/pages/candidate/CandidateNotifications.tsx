import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import {
    Bell, CheckCheck, Trash2, FileText, Calendar, Eye,
    AlertTriangle, ShieldCheck, BellOff, Sparkles,
    ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';

// ─── Type metadata for candidate-specific notification types ──────────────────
const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    application: { label: 'Ứng tuyển', icon: <FileText className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    interview:   { label: 'Phỏng vấn', icon: <Calendar className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
    job_alert:   { label: 'Việc làm', icon: <Sparkles className="w-5 h-5" />, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
    view:        { label: 'Xem hồ sơ', icon: <Eye className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
    verification:{ label: 'Xác minh', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    warning:     { label: 'Cảnh báo', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    system:      { label: 'Hệ thống', icon: <Bell className="w-5 h-5" />, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

const getMeta = (type: string) => TYPE_META[type] ?? TYPE_META.system;
const PAGE_SIZE = 10;

const TABS = [
    { key: 'all', label: 'Tất cả', icon: Bell },
    { key: 'unread', label: 'Chưa đọc', icon: BellOff },
    { key: 'application', label: 'Ứng tuyển', icon: FileText },
    { key: 'interview', label: 'Phỏng vấn', icon: Calendar },
    { key: 'job_alert', label: 'Việc làm', icon: Sparkles },
    { key: 'system', label: 'Hệ thống', icon: Bell },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CandidateNotifications() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { fetchUnreadCount, unreadCount } = useNotificationStore();

    useEffect(() => {
        const handler = window.setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => window.clearTimeout(handler);
    }, [searchQuery]);

    // ── Build query params ──────────────────────────────────────────────────
    const queryParams = (() => {
        const p: Record<string, any> = { page_size: PAGE_SIZE, page };
        if (activeTab === 'unread') p.is_read = false;
        if (['application', 'interview', 'job_alert', 'system'].includes(activeTab)) p.type = activeTab;
        if (debouncedSearch) p.search = debouncedSearch;
        return p;
    })();

    // ── Data fetching ────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['candidate-notifications', activeTab, page, debouncedSearch],
        queryFn: () => notificationService.listNotifications(queryParams).then(r => r.data),
        staleTime: 30_000,
    });

    const notifications = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // ── Mutations ─────────────────────────────────────────────────────────────
    const markReadMut = useMutation({
        mutationFn: (id: number) => notificationService.markNotificationRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate-notifications'] });
            fetchUnreadCount();
        },
    });

    const markAllMut = useMutation({
        mutationFn: () => notificationService.markAllNotificationsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate-notifications'] });
            fetchUnreadCount();
            toast.success('Đã đánh dấu tất cả là đã đọc');
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: number) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate-notifications'] });
            fetchUnreadCount();
            toast.success('Đã xóa thông báo');
        },
    });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleItemClick = (notif: any) => {
        if (!notif.is_read) markReadMut.mutate(notif.id);
        if (!notif.link) return;

        if (/^https?:\/\//i.test(notif.link)) {
            window.open(notif.link, '_blank', 'noopener,noreferrer');
            return;
        }
        navigate(notif.link);
    };

    const handleTabChange = (key: TabKey) => {
        setActiveTab(key);
        setPage(1);
    };

    return (
        <div className="w-full min-h-screen">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Thông báo"
                    description={
                        unreadCount > 0
                            ? `Bạn có ${unreadCount > 99 ? '99+' : unreadCount} thông báo chưa đọc`
                            : 'Quản lý các cập nhật về ứng tuyển, phỏng vấn và gợi ý việc làm'
                    }
                    icon={Bell}
                />
            </div>

            <div className="p-6 lg:p-8 space-y-6">
                {/* ── Filter & Search Bar ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center p-1 bg-white rounded-2xl w-full sm:w-fit border border-slate-200 shadow-sm overflow-x-auto">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={cn(
                                        'flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer',
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

                    <div className="flex w-full sm:w-auto items-center gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm thông báo..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 bg-white shadow-sm"
                            />
                        </div>
                        <Button
                            size="sm"
                            className={cn(
                                "h-11 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 gap-2 shrink-0 cursor-pointer",
                                unreadCount === 0 && "opacity-50 grayscale cursor-not-allowed"
                            )}
                            onClick={() => unreadCount > 0 && markAllMut.mutate()}
                            disabled={markAllMut.isPending || unreadCount === 0}
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span className="hidden lg:inline">Đánh dấu đã đọc</span>
                        </Button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[550px] flex flex-col">
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="divide-y divide-slate-100">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-6 p-6 animate-pulse">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0" />
                                        <div className="flex-1 space-y-3 py-1">
                                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                                            <div className="h-4 bg-slate-100 rounded w-full" />
                                            <div className="h-3 bg-slate-100 rounded w-28" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 text-center px-12">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6 border border-dashed border-slate-200">
                                    <BellOff className="w-12 h-12 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Không có thông báo</h3>
                                <p className="text-slate-400 max-w-sm leading-relaxed font-medium text-sm">
                                    {activeTab === 'unread'
                                        ? 'Bạn đã đọc hết tất cả thông báo. Quay lại sau nhé!'
                                        : 'Hiện chưa có thông báo nào trong mục này.'}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout" initial={false}>
                                <div className="p-4 sm:p-5 space-y-3 bg-slate-50/50">
                                    {notifications.map((notif: any, i: number) => {
                                        const typeName = notif.notification_type_name ?? notif.notification_type?.type_name ?? notif.type ?? 'system';
                                        const meta = getMeta(typeName);
                                        const isUnread = !notif.is_read;

                                        return (
                                            <motion.div
                                                key={notif.id}
                                                layout
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.25) }}
                                                className={cn(
                                                    'group flex items-start gap-4 sm:gap-5 p-4 sm:p-5 cursor-pointer transition-all duration-300 relative rounded-2xl border',
                                                    isUnread
                                                        ? 'bg-white border-violet-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-violet-300'
                                                        : 'bg-white/60 border-slate-200 hover:shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
                                                )}
                                                onClick={() => handleItemClick(notif)}
                                            >
                                                {/* Icon */}
                                                <div className={cn(
                                                    'flex-shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center shadow-sm transition-all',
                                                    meta.bg,
                                                    isUnread ? '' : 'opacity-60 grayscale'
                                                )}>
                                                    <div className={cn(meta.color)}>{meta.icon}</div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                            <span className={cn(
                                                                'text-sm tracking-tight transition-colors line-clamp-1',
                                                                isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'
                                                            )}>
                                                                {notif.title}
                                                            </span>
                                                            {isUnread && (
                                                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                                                            )}
                                                        </div>
                                                        <span className="flex-shrink-0 text-[11px] font-semibold text-slate-400 whitespace-nowrap mt-0.5">
                                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                                        </span>
                                                    </div>

                                                    <p className={cn(
                                                        'text-sm leading-relaxed line-clamp-2 transition-colors',
                                                        isUnread ? 'text-slate-600' : 'text-slate-400'
                                                    )}>
                                                        {notif.content ?? notif.message}
                                                    </p>

                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <Badge className={cn(
                                                            'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-none',
                                                            isUnread ? `${meta.bg} ${meta.color}` : 'bg-slate-100 text-slate-500 border-transparent opacity-60'
                                                        )}>
                                                            {meta.label}
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                                            <span>{format(new Date(notif.created_at), 'HH:mm · dd/MM/yyyy')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex-shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 ml-1">
                                                    {isUnread && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200 transition-all cursor-pointer"
                                                            onClick={(e) => { e.stopPropagation(); markReadMut.mutate(notif.id); }}
                                                        >
                                                            <CheckCheck className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                                                        onClick={(e) => { e.stopPropagation(); deleteMut.mutate(notif.id); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-xs text-slate-500 font-medium">
                                Hiển thị <span className="font-bold text-slate-900">{notifications.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> thông báo
                            </p>
                            <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-xs font-black text-violet-600">{page}</span>
                                    <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                    <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
