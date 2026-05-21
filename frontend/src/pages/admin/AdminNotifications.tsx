import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import {
    Bell, CheckCheck, Trash2, FileText, Calendar,
    AlertTriangle, ShieldCheck, BellOff, CreditCard,
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
import { useUrlSearchParam } from '@/hooks/useUrlSearchParam';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    application: { label: 'Ứng tuyển', icon: <FileText className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    interview: { label: 'Phỏng vấn', icon: <Calendar className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
    report: { label: 'Vi phạm', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    warning: { label: 'Cảnh báo', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    verification: { label: 'Xác minh', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    billing: { label: 'Thanh toán', icon: <CreditCard className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
    system: { label: 'Hệ thống', icon: <Bell className="w-5 h-5" />, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
    job_alert: { label: 'Việc làm', icon: <Bell className="w-5 h-5" />, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
};

const getMeta = (type: string) => TYPE_META[type] ?? TYPE_META.system;

const TABS = [
    { key: 'all', label: 'Tất cả', icon: Bell },
    { key: 'unread', label: 'Chưa đọc', icon: BellOff },
    { key: 'report', label: 'Vi phạm', icon: AlertTriangle },
    { key: 'verification', label: 'Xác minh', icon: ShieldCheck },
    { key: 'billing', label: 'Thanh toán', icon: CreditCard },
    { key: 'system', label: 'Hệ thống', icon: FileText },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useUrlSearchParam();
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { markAllAsRead: markAllStore, fetchUnreadCount } = useNotificationStore();

    useEffect(() => {
        const handler = window.setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => window.clearTimeout(handler);
    }, [searchQuery]);

    const { data: stats } = useQuery({
        queryKey: ['admin-notification-stats'],
        queryFn: () => notificationService.getAdminNotificationStats().then(r => r.data),
        staleTime: 30_000,
    });

    // ── Build query params ──────────────────────────────────────────────────
    const queryParams = (() => {
        const p: Record<string, any> = { page_size: 10, page };
        if (activeTab === 'unread') p.is_read = false;
        if (['report', 'verification', 'billing', 'system'].includes(activeTab)) p.type = activeTab;
        if (debouncedSearch) p.search = debouncedSearch;
        return p;
    })();

    // ── Data fetching ────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['admin-notifications', activeTab, page, debouncedSearch],
        queryFn: () => notificationService.listAdminNotifications(queryParams).then(r => r.data),
        staleTime: 30_000,
    });

    const notifications = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = data?.total_pages ?? 1;
    const unreadCount = activeTab === 'all'
        ? (stats?.total_unread ?? 0)
        : totalCount;

    // ── Mutations ─────────────────────────────────────────────────────────────
    const markReadMut = useMutation({
        mutationFn: (id: number) => notificationService.markAdminNotificationRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
            fetchUnreadCount();
        },
    });

    const markAllMut = useMutation({
        mutationFn: () => {
            return notificationService.bulkMarkAdminNotificationsRead([]);
        },
        onSuccess: () => {
            markAllStore();
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
            toast.success('Hộp thư đã được cập nhật');
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: number) => notificationService.deleteAdminNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
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
                        <Bell className="w-6 h-6 text-blue-600" />
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
                                        ? 'bg-blue-600 text-white shadow-md'
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
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm thông báo..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 bg-white shadow-sm"
                        />
                    </div>
                    <Button
                        size="sm"
                        className={cn(
                            "h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 gap-2",
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
                            <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
                                {notifications.map((notif: any, i: number) => {
                                    const typeName = notif.notification_type_name ?? notif.notification_type?.type_name ?? notif.type ?? 'system';
                                    const meta = getMeta(typeName);
                                    const isUnread = !notif.is_read;

                                    return (
                                        <motion.div
                                            key={notif.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                                            className={cn(
                                                'group flex items-start gap-4 sm:gap-6 p-5 sm:p-6 cursor-pointer transition-all duration-300 relative rounded-2xl border',
                                                isUnread
                                                    ? 'bg-white border-blue-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300'
                                                    : 'bg-white/60 border-slate-200 hover:shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
                                            )}
                                            onClick={() => handleItemClick(notif)}
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                'flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm transition-all',
                                                meta.bg,
                                                isUnread ? 'border-blue-100 shadow-blue-100/50' : 'border-slate-100 opacity-70 grayscale'
                                            )}>
                                                <div className={cn(meta.color)}>{meta.icon}</div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className={cn(
                                                            'text-base tracking-tight transition-colors line-clamp-1',
                                                            isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'
                                                        )}>
                                                            {notif.title}
                                                        </span>
                                                        {isUnread && (
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 text-xs font-semibold text-slate-400 whitespace-nowrap mt-1">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                                    </div>
                                                </div>

                                                <p className={cn(
                                                    'text-sm leading-relaxed line-clamp-2 transition-colors',
                                                    isUnread ? 'text-slate-600' : 'text-slate-400'
                                                )}>
                                                    {notif.content ?? notif.message}
                                                </p>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <Badge className={cn(
                                                        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-none',
                                                        meta.bg, meta.color,
                                                        isUnread ? 'border-blue-100' : 'border-transparent opacity-60 bg-slate-100 text-slate-500'
                                                    )}>
                                                        {meta.label}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                                        <span>#{notif.id}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span>{format(new Date(notif.created_at), 'HH:mm · dd/MM/yyyy')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 ml-2">
                                                {isUnread && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); markReadMut.mutate(notif.id); }}
                                                    >
                                                        <CheckCheck className="w-5 h-5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                                                    onClick={(e) => { e.stopPropagation(); deleteMut.mutate(notif.id); }}
                                                >
                                                    <Trash2 className="w-5 h-5" />
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
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-500 font-medium">
                            Hiển thị <span className="font-bold text-slate-900">{notifications.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> thông báo
                        </p>
                        <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <span className="text-xs font-black text-blue-600">{page}</span>
                                <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
