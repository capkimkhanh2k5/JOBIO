import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Eye, Edit3, Copy, Users, XCircle, RotateCcw, Trash2,
    MoreHorizontal, MapPin, Clock, Briefcase,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { EmployerJob } from './ManageJobsTable';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: 'Nháp', className: 'bg-slate-500/15 text-slate-300 border-slate-500/20' },
    pending: { label: 'Chờ duyệt', className: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
    active: { label: 'Đang tuyển', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
    closed: { label: 'Đã đóng', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
    expired: { label: 'Hết hạn', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
};

interface ManageJobsListProps {
    jobs: EmployerJob[];
    isLoading: boolean;
    selectedIds: string[];
    onSelectOne: (id: string, checked: boolean) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: string) => void;
    pageSize: number;
}

export function ManageJobsList({
    jobs, isLoading, selectedIds, onSelectOne,
    onDelete, onDuplicate, onToggleStatus, pageSize,
}: ManageJobsListProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array(pageSize).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                        <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                        <Skeleton className="h-4 w-20 rounded" />
                        <Skeleton className="h-4 w-8 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <p className="font-semibold">Chưa có tin tuyển dụng</p>
                    <p className="text-sm text-muted-foreground mt-1">Đăng tin đầu tiên để bắt đầu tuyển dụng!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {jobs.map((job, i) => {
                const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
                const isSelected = selectedIds.includes(job.id);

                return (
                    <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 group
                            ${isSelected
                                ? 'bg-cyan-500/5 border-cyan-500/20'
                                : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                            }`}
                    >
                        {/* Checkbox */}
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => onSelectOne(job.id, e.target.checked)}
                            className="w-4 h-4 shrink-0 rounded border-white/20 bg-white/10 accent-cyan-500 cursor-pointer"
                            aria-label={`Select ${job.title}`}
                        />

                        {/* Title + meta */}
                        <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                {job.is_featured && (
                                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded px-1 py-0.5 uppercase tracking-wide">
                                        Featured
                                    </span>
                                )}
                                <p className="font-semibold text-foreground group-hover:text-cyan-300 transition-colors truncate">
                                    {job.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {job.deadline ? format(new Date(job.deadline), 'dd/MM/yyyy', { locale: vi }) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> {job.views_count.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {job.applications_count}
                            </span>
                        </div>

                        {/* Status badge */}
                        <Badge className={`text-[11px] font-medium border shrink-0 ${cfg.className}`}>
                            {cfg.label}
                        </Badge>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    aria-label="Job actions"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-white border-border shadow-lg">
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                                    <Eye className="w-4 h-4" /> Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}>
                                    <Edit3 className="w-4 h-4" /> Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onDuplicate(job.id)}>
                                    <Copy className="w-4 h-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/employer/jobs/${job.id}/candidates`)}>
                                    <Users className="w-4 h-4" /> Xem ứng viên
                                    {job.applications_count > 0 && (
                                        <span className="ml-auto text-[11px] font-bold bg-violet-500/20 text-violet-300 rounded-full px-1.5">
                                            {job.applications_count}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/8" />
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onToggleStatus(job.id, job.status)}>
                                    {job.status === 'active'
                                        ? <><XCircle className="w-4 h-4 text-orange-400" /> Đóng tin</>
                                        : <><RotateCcw className="w-4 h-4 text-emerald-400" /> Mở lại tin</>
                                    }
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/8" />
                                <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                    onClick={() => onDelete(job.id)}
                                >
                                    <Trash2 className="w-4 h-4" /> Xóa tin
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                );
            })}
        </div>
    );
}
