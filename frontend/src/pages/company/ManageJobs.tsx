import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Briefcase, PlusSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { companyService } from '@/services/companyService';
import { jobService } from '@/services/jobService';
import api from '@/services/api';
import {
    ManageJobsActionBar,
    type ViewMode,
    type JobStatusFilter,
    type SortOption,
} from '@/components/company/ManageJobsActionBar';
import { ManageJobsTable } from '@/components/company/ManageJobsTable';
import { ManageJobsList } from '@/components/company/ManageJobsList';
import { ManageJobsGrid } from '@/components/company/ManageJobsGrid';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { useUserStore } from '@/store/userStore';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ManageJobs() {
    const queryClient = useQueryClient();
    const { user } = useUserStore();

    // Filters & pagination state
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
    const [sortOption, setSortOption] = useState<SortOption>('-posted_at');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // ── Fetch company jobs ────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['company-jobs', user?.company_id, statusFilter, sortOption, search, page, pageSize],
        queryFn: () =>
            companyService.listMyJobs({
                status: statusFilter === 'all' ? undefined : statusFilter,
                ordering: sortOption,
                search: search || undefined,
                page,
                page_size: pageSize,
            }).then(r => r.data),
        placeholderData: prev => prev,
        staleTime: 30_000,
        enabled: !!user?.company_id,
    });

    const jobs = data?.results ?? [];
    const total = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // ── Fetch company stats for job counts ──────────────────────────────────
    const { data: allJobsResponse } = useQuery({
        queryKey: ['company-jobs-all', user?.company_id],
        queryFn: () =>
            companyService.listMyJobs({
                ordering: '-posted_at',
                page: 1,
                page_size: 1000,
            }).then(r => r.data),
        staleTime: 30_000,
        enabled: !!user?.company_id,
    });

    const allJobs = allJobsResponse?.results ?? [];
    const statsJobs = {
        total: allJobsResponse?.count ?? 0,
        published: allJobs.filter(job => job.status === 'published').length,
        draft: allJobs.filter(job => job.status === 'draft').length,
        closed: allJobs.filter(job => job.status === 'closed' || job.status === 'expired').length,
    };

    // Reset page when filter/search changes
    const handleStatusChange = (s: JobStatusFilter) => {
        setStatusFilter(s);
        setPage(1);
        setSelectedIds([]);
    };
    const handleSortChange = (s: SortOption) => {
        setSortOption(s);
        setPage(1);
    };
    const handleSearch = (v: string) => {
        setSearch(v);
        setPage(1);
        setSelectedIds([]);
    };

    // ── Mutations ──────────────────────────────────────────────────────────
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
        queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => jobService.delete(Number(id)),
        onSuccess: (_, id) => {
            toast.success('Đã xóa tin tuyển dụng');
            setSelectedIds(prev => prev.filter(x => x !== Number(id)));
            invalidate();
        },
        onError: () => toast.error('Xóa tin thất bại. Vui lòng thử lại.'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            jobService.update(Number(id), { status } as any).then(r => r.data),
        onSuccess: (_, { status }) => {
            toast.success(status === 'closed' ? 'Đã đóng tin tuyển dụng' : 'Đã mở lại tin tuyển dụng');
            invalidate();
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: string) => jobService.duplicate(Number(id)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã tạo bản sao tin tuyển dụng (trạng thái Nháp)');
            invalidate();
        },
    });

    const bulkMutation = useMutation({
        mutationFn: ({ ids, action }: { ids: number[]; action: 'close' | 'delete' | 'extend' }) =>
            api.post('/api/jobs/bulk-action/', { ids, action }).then(r => r.data),
        onSuccess: (data, { action }) => {
            const msg = action === 'close'
                ? `Đã đóng ${data.affected} tin tuyển dụng`
                : action === 'delete'
                    ? `Đã xóa ${data.affected} tin tuyển dụng`
                    : `Đã gia hạn ${data.affected} tin tuyển dụng`;
            toast.success(msg);
            setSelectedIds([]);
            invalidate();
        },
    });

    // ── Selection handlers ─────────────────────────────────────────────────
    const handleSelectAll = useCallback(
        (checked: boolean) => setSelectedIds(checked ? jobs.map(j => Number(j.id)) : []),
        [jobs]
    );
    const handleSelectOne = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, Number(id)] : prev.filter(x => x !== Number(id)));
    }, []);

    // ── Per-row action handlers ────────────────────────────────────────────
    const handleDelete = (id: string) => deleteMutation.mutate(id);
    const handleDuplicate = (id: string) => duplicateMutation.mutate(id);
    const handleToggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'published' ? 'closed' : 'published';
        statusMutation.mutate({ id, status: newStatus });
    };

    // ── Bulk handlers ──────────────────────────────────────────────────────
    const handleBulkClose = () => bulkMutation.mutate({ ids: selectedIds, action: 'close' });
    const handleBulkDelete = () => bulkMutation.mutate({ ids: selectedIds, action: 'delete' });
    const handleBulkExtend = () => bulkMutation.mutate({ ids: selectedIds, action: 'extend' });

    // Shared view props
    const viewProps = {
        jobs,
        isLoading,
        selectedIds,
        onDelete: handleDelete,
        onDuplicate: handleDuplicate,
        onToggleStatus: handleToggleStatus,
        pageSize,
    };

    return (
        <div className="w-full mx-auto min-h-screen">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Quản lý tin tuyển dụng"
                    description={total > 0
                        ? `${total} tin tuyển dụng · Đang hiển thị ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)}`
                        : 'Đăng và quản lý tất cả tin tuyển dụng của bạn'}
                    icon={Briefcase}
                    action={
                        <Link to="/company/jobs/create">
                            <button className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all">
                                <PlusSquare className="w-4 h-4" />
                                Đăng tin mới
                            </button>
                        </Link>
                    }
                />
            </div>

            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6">
                {/* Summary stat cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                    {(
                        [
                            { label: 'Tất cả', value: statsJobs.total, key: 'all' as const, activeClass: 'border-slate-200 bg-white shadow-md ring-2 ring-slate-100', inactiveClass: 'border-slate-100 bg-slate-50/50 hover:bg-white', text: 'text-slate-900' },
                            { label: 'Đang tuyển', value: statsJobs.published, key: 'published' as const, activeClass: 'border-emerald-200 bg-emerald-50 shadow-md shadow-emerald-100 ring-2 ring-emerald-50', inactiveClass: 'border-slate-100 bg-slate-50/50 hover:bg-emerald-50/50', text: 'text-emerald-600' },
                            { label: 'Nháp', value: statsJobs.draft, key: 'draft' as const, activeClass: 'border-slate-200 bg-slate-100 shadow-md ring-2 ring-slate-50', inactiveClass: 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50', text: 'text-slate-500' },
                            { label: 'Đã đóng', value: statsJobs.closed, key: 'closed' as const, activeClass: 'border-rose-200 bg-rose-50 shadow-md shadow-rose-100 ring-2 ring-rose-50', inactiveClass: 'border-slate-100 bg-slate-50/50 hover:bg-rose-50/50', text: 'text-rose-600' },
                        ] as const
                    ).map(stat => (
                        <button
                            key={stat.key}
                            onClick={() => handleStatusChange(stat.key)}
                            className={`p-5 rounded-3xl border text-left transition-all duration-300
                                ${statusFilter === stat.key ? stat.activeClass : stat.inactiveClass}`}
                        >
                            <p className={`text-2xl font-black ${stat.text}`}>{stat.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
                        </button>
                    ))}
                </motion.div>

                {/* Action bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    <ManageJobsActionBar
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        statusFilter={statusFilter}
                        onStatusFilterChange={handleStatusChange}
                        sortOption={sortOption}
                        onSortChange={handleSortChange}
                        searchValue={search}
                        onSearchChange={handleSearch}
                        selectedIds={selectedIds.map(String)}
                        onBulkClose={handleBulkClose}
                        onBulkDelete={handleBulkDelete}
                        onBulkExtend={handleBulkExtend}
                    />
                </motion.div>

                {/* View content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        {viewMode === 'table' && (
                            <ManageJobsTable
                                {...viewProps}
                                jobs={jobs as any}
                                selectedIds={selectedIds.map(String)}
                                onSelectAll={handleSelectAll}
                                onSelectOne={handleSelectOne}
                            />
                        )}
                        {viewMode === 'list' && (
                            <ManageJobsList
                                {...viewProps}
                                jobs={jobs as any}
                                selectedIds={selectedIds.map(String)}
                                onSelectOne={handleSelectOne}
                            />
                        )}
                        {viewMode === 'grid' && (
                            <ManageJobsGrid
                                {...viewProps}
                                jobs={jobs as any}
                                selectedIds={selectedIds.map(String)}
                                onSelectOne={handleSelectOne}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Pagination */}
                {!isLoading && total > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center justify-between gap-4 mt-6"
                    >
                        {/* Rows per page */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Hiển thị</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={v => { setPageSize(Number(v)); setPage(1); }}
                            >
                                <SelectTrigger className="w-16 h-8 bg-white border-border text-foreground text-xs shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-border shadow-lg">
                                    {PAGE_SIZE_OPTIONS.map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>/ trang</span>
                        </div>

                        {/* Page nav */}
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-all"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                    if (i > 0 && arr[i - 1] !== undefined && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p as number)}
                                            className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all
                                                ${page === p
                                                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20 border-violet-600'
                                                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                                }`}
                                            aria-current={page === p ? 'page' : undefined}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-all"
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Page info */}
                        <p className="text-sm text-muted-foreground">
                            Trang {page} / {totalPages}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
