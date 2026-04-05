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
export type JobStatusFilter = 'all' | 'draft' | 'published' | 'closed' | 'expired';
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
    published: 'Đang tuyển',
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
                    className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-violet-500/25 shrink-0 rounded-xl h-10 px-6"
                >
                    <Plus className="w-4 h-4" />
                    Tạo tin mới
                </Button>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        defaultValue={searchValue}
                        onChange={handleSearchInput}
                        placeholder="Tìm kiếm vị trí..."
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 transition-all font-medium"
                    />
                </div>

                {/* Status filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 bg-white border-slate-200 hover:bg-slate-50 text-sm font-medium h-10 rounded-xl">
                            {STATUS_LABELS[statusFilter]}
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                        <Button variant="outline" size="sm" className="gap-1.5 bg-white border-slate-200 hover:bg-slate-50 text-sm font-medium h-10 rounded-xl">
                            {SORT_LABELS[sortOption]}
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                <div className="flex items-center rounded-xl overflow-hidden border border-slate-200 bg-slate-50 ml-auto h-10 p-1">
                    {(['table', 'list', 'grid'] as ViewMode[]).map((mode) => {
                        const Icon = mode === 'table' ? Table2 : mode === 'list' ? AlignJustify : LayoutGrid;
                        return (
                            <button
                                key={mode}
                                onClick={() => onViewModeChange(mode)}
                                aria-label={`View as ${mode}`}
                                className={`p-1.5 rounded-lg cursor-pointer transition-all duration-150 ${viewMode === mode
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
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
                        <span className="text-sm font-bold text-violet-600">
                            Đã chọn {selectedIds.length} tin
                        </span>
                        <div className="flex-1" />
                        <Button
                            size="sm" variant="outline"
                            onClick={onBulkExtend}
                            className="gap-1.5 border-violet-200 hover:bg-white text-violet-600 text-xs font-bold rounded-lg h-8"
                        >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Gia hạn deadline
                        </Button>
                        <Button
                            size="sm" variant="outline"
                            onClick={onBulkClose}
                            className="gap-1.5 border-orange-200 hover:bg-white text-orange-600 text-xs font-bold rounded-lg h-8"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Đóng tin đã chọn
                        </Button>
                        <Button
                            size="sm" variant="outline"
                            onClick={onBulkDelete}
                            className="gap-1.5 border-red-200 hover:bg-white text-red-600 text-xs font-bold rounded-lg h-8"
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
