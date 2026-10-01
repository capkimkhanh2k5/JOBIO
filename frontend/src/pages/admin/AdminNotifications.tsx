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
    application: { label: 'Ứng tuyển', icon: <FileText className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/8 border-primary/12' },
    interview: { label: 'Phỏng vấn', icon: <Calendar className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
    report: { label: 'Vi phạm', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    warning: { label: 'Cảnh báo', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    verification: { label: 'Xác minh', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    billing: { label: 'Thanh toán', icon: <CreditCard className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
    system: { label: 'Hệ thống', icon: <Bell className="w-5 h-5" />, color: 'text-muted-foreground', bg: 'bg-muted border-border' },
    job_alert: { label: 'Việc làm', icon: <Bell className="w-5 h-5" />, color: 'text-teal-600', bg: 'bg-teal-50 border-cyan-100' },
};

const getMeta = (type: string) => TYPE_META[type] ?? TYPE_META.system;
const PAGE_SIZE = 10;

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
    const { fetchUnreadCount } = useNotificationStore();

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
        const p: Record<string, any> = { page_size: PAGE_SIZE, page };
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
    const totalPages = Math.max(1, data?.total_pages ?? Math.ceil(totalCount / PAGE_SIZE));
    const unreadCount = stats?.total_unread ?? 0;

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
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
            fetchUnreadCount();
            toast.success('Hộp thư đã được cập nhật');
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: number) => notificationService.deleteAdminNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
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

    const fadeUp = (delay: number) => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1 bg-muted/30 min-h-screen">
            {/* ── Page Header ── */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <Bell className="w-6 h-6 text-primary" />
                        Quản lý Thông báo
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Hệ thống giám sát và quản lý thông báo toàn nền tảng.</p>
                </div>

                <div className="bg-card px-5 py-2.5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-0.5">Tình trạng</p>
                        <p className="text-sm font-black text-foreground">
                            {totalCount.toLocaleString()} <span className="text-muted-foreground font-medium ml-1">tin nhắn</span>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ── Filter & Search Bar ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center p-1 bg-card rounded-2xl w-full sm:w-fit border border-border shadow-sm">
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
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-muted-foreground/60')} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm thông báo..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary bg-card shadow-sm"
                        />
                    </div>
                    <Button
                        size="sm"
                        className={cn(
                            "h-11 px-6 bg-primary hover:bg-primary text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 gap-2",
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
            <div className="bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden min-h-[650px] flex flex-col">
                <div className="flex-1">
                    {isLoading ? (
                        <div className="divide-y divide-slate-100">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-8 p-8 animate-pulse">
                                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border/60 flex-shrink-0" />
                                    <div className="flex-1 space-y-4 py-2">
                                        <div className="h-5 bg-muted rounded w-1/4" />
                                        <div className="h-5 bg-muted rounded w-full" />
                                        <div className="h-4 bg-muted rounded w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-52 text-center px-12">
                            <div className="w-32 h-32 rounded-[3rem] bg-muted flex items-center justify-center mb-8 border border-dashed border-border">
                                <BellOff className="w-14 h-14 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-3">Hộp thư sạch sẽ</h3>
                            <p className="text-muted-foreground/60 max-w-sm leading-relaxed font-bold text-base">
                                {activeTab === 'unread'
                                    ? 'Hiện tại chưa có thông báo mới.'
                                    : 'Hiện tại chưa có thông báo.'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout" initial={false}>
                            <div className="p-4 sm:p-6 space-y-4 bg-muted/50">
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
                                                    ? 'bg-card border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/25'
                                                    : 'bg-card/60 border-border hover:shadow-sm hover:-translate-y-0.5 hover:border-border hover:bg-card'
                                            )}
                                            onClick={() => handleItemClick(notif)}
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                'flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm transition-all',
                                                meta.bg,
                                                isUnread ? 'border-primary/12 shadow-primary/10' : 'border-border/60 opacity-70 grayscale'
                                            )}>
                                                <div className={cn(meta.color)}>{meta.icon}</div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className={cn(
                                                            'text-base tracking-tight transition-colors line-clamp-1',
                                                            isUnread ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'
                                                        )}>
                                                            {notif.title}
                                                        </span>
                                                        {isUnread && (
                                                            <span className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 text-xs font-semibold text-muted-foreground/60 whitespace-nowrap mt-1">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                                    </div>
                                                </div>

                                                <p className={cn(
                                                    'text-sm leading-relaxed line-clamp-2 transition-colors',
                                                    isUnread ? 'text-muted-foreground' : 'text-muted-foreground/60'
                                                )}>
                                                    {notif.content ?? notif.message}
                                                </p>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <Badge className={cn(
                                                        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-none',
                                                        meta.bg, meta.color,
                                                        isUnread ? 'border-primary/12' : 'border-transparent opacity-60 bg-muted text-muted-foreground'
                                                    )}>
                                                        {meta.label}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
                                                        <span>#{notif.id}</span>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/20"></span>
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
                                                        className="w-10 h-10 rounded-xl bg-card shadow-sm border border-border text-muted-foreground/60 hover:text-primary hover:bg-primary/8 hover:border-primary/20 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); markReadMut.mutate(notif.id); }}
                                                    >
                                                        <CheckCheck className="w-5 h-5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-xl bg-card shadow-sm border border-border text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
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
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-border/60 bg-muted/50">
                        <p className="text-xs text-muted-foreground font-medium">
                            Hiển thị <span className="font-bold text-foreground">{notifications.length}</span> / <span className="font-bold text-foreground">{totalCount}</span> thông báo
                        </p>
                        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-card hover:shadow-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center px-3 h-8 bg-card border border-border rounded-lg shadow-sm">
                                <span className="text-xs font-black text-primary">{page}</span>
                                <span className="mx-1.5 text-muted-foreground/40 text-[10px]">/</span>
                                <span className="text-xs font-bold text-muted-foreground">{totalPages}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-card hover:shadow-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
