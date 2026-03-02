import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mockApi } from '@/services/mockApi';
import {
    ManageJobsActionBar,
    type ViewMode,
    type JobStatusFilter,
    type SortOption,
} from '@/components/employer/ManageJobsActionBar';
import { ManageJobsTable } from '@/components/employer/ManageJobsTable';
import { ManageJobsList } from '@/components/employer/ManageJobsList';
import { ManageJobsGrid } from '@/components/employer/ManageJobsGrid';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ManageJobs() {
    const queryClient = useQueryClient();

    // Filters & pagination state
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
    const [sortOption, setSortOption] = useState<SortOption>('-posted_at');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // ── Fetch employer jobs ────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['employer-jobs', statusFilter, sortOption, search, page, pageSize],
        queryFn: () =>
            mockApi.getEmployerJobs({
                status: statusFilter === 'all' ? undefined : statusFilter,
                ordering: sortOption,
                search: search || undefined,
                page,
                page_size: pageSize,
            }),
        placeholderData: prev => prev,
        staleTime: 30_000,
    });

    const jobs = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mockApi.deleteJob(id),
        onSuccess: (_, id) => {
            toast.success('Đã xóa tin tuyển dụng');
            setSelectedIds(prev => prev.filter(x => x !== id));
            invalidate();
        },
        onError: () => toast.error('Xóa tin thất bại. Vui lòng thử lại.'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            mockApi.patchJobStatus(id, status),
        onSuccess: (_, { status }) => {
            toast.success(status === 'closed' ? 'Đã đóng tin tuyển dụng' : 'Đã mở lại tin tuyển dụng');
            invalidate();
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: string) => mockApi.duplicateJob(id),
        onSuccess: () => {
            toast.success('Đã tạo bản sao tin tuyển dụng (trạng thái Nháp)');
            invalidate();
        },
    });

    const bulkMutation = useMutation({
        mutationFn: ({ ids, action }: { ids: string[]; action: 'close' | 'delete' | 'extend' }) =>
            mockApi.bulkJobAction(ids, action),
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
        (checked: boolean) => setSelectedIds(checked ? jobs.map(j => j.id) : []),
        [jobs]
    );
    const handleSelectOne = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    }, []);

    // ── Per-row action handlers ────────────────────────────────────────────
    const handleDelete = (id: string) => deleteMutation.mutate(id);
    const handleDuplicate = (id: string) => duplicateMutation.mutate(id);
    const handleToggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'closed' : 'active';
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
        <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
            >
                <h1 className="text-2xl font-black text-foreground">Quản lý tin tuyển dụng</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {total > 0
                        ? `${total} tin tuyển dụng · Đang hiển thị ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)}`
                        : 'Không tìm thấy tin tuyển dụng phù hợp'
                    }
                </p>
            </motion.div>

            {/* Summary stat cards */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"
            >
                {(
                    [
                        { label: 'Tất cả', value: 30, key: 'all' as const, color: 'from-slate-500/10 to-slate-400/5', text: 'text-foreground' },
                        { label: 'Đang tuyển', value: 6, key: 'active' as const, color: 'from-emerald-500/15 to-emerald-400/5', text: 'text-emerald-300' },
                        { label: 'Chờ duyệt', value: 6, key: 'pending' as const, color: 'from-amber-500/15 to-amber-400/5', text: 'text-amber-300' },
                        { label: 'Nháp', value: 6, key: 'draft' as const, color: 'from-slate-500/15 to-slate-400/5', text: 'text-slate-300' },
                        { label: 'Đã đóng / Hết hạn', value: 12, key: 'closed' as const, color: 'from-red-500/10 to-red-400/5', text: 'text-red-400' },
                    ] as const
                ).map(stat => (
                    <button
                        key={stat.key}
                        onClick={() => handleStatusChange(stat.key)}
                        className={`p-3 rounded-xl border text-left transition-all duration-150
                            bg-gradient-to-br ${stat.color}
                            ${statusFilter === stat.key
                                ? 'border-white/20 shadow-md'
                                : 'border-white/8 hover:border-white/14'
                            }`}
                    >
                        <p className={`text-xl font-black ${stat.text}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </button>
                ))}
            </motion.div>

            {/* Action bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-4"
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
                    selectedIds={selectedIds}
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
                            onSelectAll={handleSelectAll}
                            onSelectOne={handleSelectOne}
                        />
                    )}
                    {viewMode === 'list' && (
                        <ManageJobsList
                            {...viewProps}
                            onSelectOne={handleSelectOne}
                        />
                    )}
                    {viewMode === 'grid' && (
                        <ManageJobsGrid
                            {...viewProps}
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
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-foreground border border-white/15'
                                                : 'border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
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
    );
}
