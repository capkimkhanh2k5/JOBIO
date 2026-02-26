import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ChevronDown, LayoutGrid, AlignJustify, Table2,
    Trash2, XCircle, CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
    DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ViewMode = 'table' | 'list' | 'grid';
export type JobStatusFilter = 'all' | 'draft' | 'pending' | 'active' | 'closed' | 'expired';
export type SortOption = '-posted_at' | 'posted_at' | 'deadline' | '-views_count' | '-applications_count';

interface ManageJobsActionBarProps {
    viewMode: ViewMode;
    onViewModeChange: (v: ViewMode) => void;
    statusFilter: JobStatusFilter;
    onStatusFilterChange: (s: JobStatusFilter) => void;
    sortOption: SortOption;
    onSortChange: (s: SortOption) => void;
    searchValue: string;
    onSearchChange: (v: string) => void;
    selectedIds: string[];
    onBulkClose: () => void;
    onBulkDelete: () => void;
    onBulkExtend: () => void;
}

const STATUS_LABELS: Record<JobStatusFilter, string> = {
    all: 'Tất cả trạng thái',
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    active: 'Đang tuyển',
    closed: 'Đã đóng',
    expired: 'Hết hạn',
};

const SORT_LABELS: Record<SortOption, string> = {
    '-posted_at': 'Mới nhất',
    'posted_at': 'Cũ nhất',
    'deadline': 'Deadline gần nhất',
    '-views_count': 'Lượt xem nhiều nhất',
    '-applications_count': 'Ứng viên nhiều nhất',
};

export function ManageJobsActionBar({
    viewMode, onViewModeChange,
    statusFilter, onStatusFilterChange,
    sortOption, onSortChange,
    searchValue, onSearchChange,
    selectedIds, onBulkClose, onBulkDelete, onBulkExtend,
}: ManageJobsActionBarProps) {
    const navigate = useNavigate();
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearTimeout(searchTimer.current);
        const val = e.target.value;
        searchTimer.current = setTimeout(() => onSearchChange(val), 300);
    };

    const hasBulk = selectedIds.length > 0;

    return (
        <div className="space-y-3">
            {/* Main bar */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Create button */}
                <Button
                    onClick={() => navigate('/employer/jobs/create')}
                    className="gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold shadow-lg shadow-cyan-500/20 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Tạo tin mới
                </Button>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        defaultValue={searchValue}
                        onChange={handleSearchInput}
                        placeholder="Tìm kiếm vị trí..."
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50 focus:bg-white/8 transition-all"
                    />
                </div>

                {/* Status filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-sm">
                            {STATUS_LABELS[statusFilter]}
                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-white border-border shadow-lg">
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={v => onStatusFilterChange(v as JobStatusFilter)}>
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                <DropdownMenuRadioItem key={val} value={val} className="cursor-pointer">
                                    {label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-sm">
                            {SORT_LABELS[sortOption]}
                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-white border-border shadow-lg">
                        <DropdownMenuRadioGroup value={sortOption} onValueChange={v => onSortChange(v as SortOption)}>
                            {Object.entries(SORT_LABELS).map(([val, label]) => (
                                <DropdownMenuRadioItem key={val} value={val} className="cursor-pointer">
                                    {label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* View toggle */}
                <div className="flex items-center rounded-xl overflow-hidden border border-white/10 bg-white/5 ml-auto">
                    {(['table', 'list', 'grid'] as ViewMode[]).map((mode) => {
                        const Icon = mode === 'table' ? Table2 : mode === 'list' ? AlignJustify : LayoutGrid;
                        return (
                            <button
                                key={mode}
                                onClick={() => onViewModeChange(mode)}
                                aria-label={`View as ${mode}`}
                                className={`p-2 transition-all duration-150 ${viewMode === mode
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/8'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bulk actions bar */}
            <AnimatePresence>
                {hasBulk && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20"
                    >
                        <span className="text-sm font-semibold text-violet-300">
                            Đã chọn {selectedIds.length} tin
                        </span>
                        <div className="flex-1" />
                        <Button
                            size="sm" variant="outline"
                            onClick={onBulkExtend}
                            className="gap-1.5 border-violet-400/30 hover:bg-violet-500/15 text-violet-300 text-xs"
                        >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Gia hạn deadline
                        </Button>
                        <Button
                            size="sm" variant="outline"
                            onClick={onBulkClose}
                            className="gap-1.5 border-orange-400/30 hover:bg-orange-500/15 text-orange-300 text-xs"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Đóng tin đã chọn
                        </Button>
                        <Button
                            size="sm" variant="outline"
                            onClick={onBulkDelete}
                            className="gap-1.5 border-red-400/30 hover:bg-red-500/15 text-red-400 text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa đã chọn
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
