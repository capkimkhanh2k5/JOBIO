import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Eye, Edit3, Copy, Users, XCircle, RotateCcw, Trash2,
    MoreHorizontal, MapPin, CalendarDays, Briefcase,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { EmployerJob } from './ManageJobsTable';

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
    draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm', dotColor: 'bg-slate-500' },
    pending: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm', dotColor: 'bg-amber-500' },
    published: { label: 'Đang tuyển', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm', dotColor: 'bg-emerald-500' },
    closed: { label: 'Đã đóng', className: 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm', dotColor: 'bg-rose-500' },
    expired: { label: 'Hết hạn', className: 'bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm', dotColor: 'bg-zinc-500' },
};

interface ManageJobsGridProps {
    jobs: EmployerJob[];
    isLoading: boolean;
    selectedIds: string[];
    onSelectOne: (id: string, checked: boolean) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: string) => void;
    pageSize: number;
}

function GridSkeleton({ count }: { count: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/8 bg-white/[0.03] space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-3 w-1/2 rounded" />
                        <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function JobGridCard({
    job, isSelected, onSelect, onDelete, onDuplicate, onToggleStatus,
}: {
    job: EmployerJob;
    isSelected: boolean;
    onSelect: (checked: boolean) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onToggleStatus: () => void;
}) {
    const navigate = useNavigate();
    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
    const isDeadlineSoon = job.deadline ? new Date(job.deadline).getTime() - Date.now() < 3 * 86400000 : false;
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className={`relative flex flex-col p-4 rounded-2xl border transition-all duration-200 group
                ${isSelected
                    ? 'bg-cyan-500/8 border-cyan-500/25 shadow-lg shadow-cyan-500/10'
                    : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.06] hover:border-white/14 hover:shadow-lg hover:shadow-black/20'
                }`}
        >
            {/* Featured ribbon */}
            {job.is_featured && (
                <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        Featured
                    </span>
                </div>
            )}

            {/* Checkbox + Status */}
            <div className="flex items-start justify-between mb-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => onSelect(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 accent-cyan-500 cursor-pointer mt-0.5"
                    aria-label={`Select ${job.title}`}
                />
                <Badge variant="outline" className={`text-[10px] font-medium border ${cfg.className}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dotColor} ${job.status === 'published' ? 'animate-pulse' : ''}`} />
                    {cfg.label}
                </Badge>
            </div>

            {/* Title */}
            <h3
                className="font-semibold text-foreground group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-2 mb-3 leading-snug"
                onClick={() => navigate(`/jobs/${job.id}`)}
            >
                {job.title}
            </h3>

            {/* Meta */}
            <div className="space-y-1.5 text-xs text-muted-foreground mb-4 flex-1">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{job.location}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isDeadlineSoon && job.status === 'published' ? 'text-amber-400' : ''}`}>
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    <span>Hết hạn: {job.deadline ? format(new Date(job.deadline), 'dd/MM/yyyy', { locale: vi }) : '—'}</span>
                    {isDeadlineSoon && job.status === 'published' && ' ⚠️'}
                </div>
            </div>

            {/* Stats bar */}
            <motion.div
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/6 mb-3"
                animate={{ opacity: hovered ? 1 : 0.8 }}
            >
                <div className="flex-1 text-center">
                    <p className="text-base font-bold text-foreground">{job.views_count.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Lượt xem</p>
                </div>
                <div className="w-px h-8 bg-white/8" />
                <div className="flex-1 text-center">
                    <p className="text-base font-bold text-cyan-400">{job.applications_count}</p>
                    <p className="text-[10px] text-muted-foreground">Ứng viên</p>
                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/8 hover:border-white/14 transition-all"
                >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                    onClick={() => navigate(`/employer/jobs/${job.id}/candidates`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/15 hover:border-cyan-400/30 transition-all"
                >
                    <Users className="w-3.5 h-3.5" /> Ứng viên
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/8 hover:border-white/14 transition-all"
                            aria-label="More actions"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border-border shadow-lg">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                            <Eye className="w-4 h-4" /> Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onDuplicate}>
                            <Copy className="w-4 h-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/8" />
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onToggleStatus}>
                            {job.status === 'published'
                                ? <><XCircle className="w-4 h-4 text-orange-400" /> Đóng tin</>
                                : <><RotateCcw className="w-4 h-4 text-emerald-400" /> Mở lại tin</>
                            }
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/8" />
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={onDelete}
                        >
                            <Trash2 className="w-4 h-4" /> Xóa tin
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

export function ManageJobsGrid({
    jobs, isLoading, selectedIds, onSelectOne,
    onDelete, onDuplicate, onToggleStatus, pageSize,
}: ManageJobsGridProps) {
    if (isLoading) return <GridSkeleton count={pageSize} />;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {jobs.map(job => (
                <JobGridCard
                    key={job.id}
                    job={job}
                    isSelected={selectedIds.includes(job.id)}
                    onSelect={checked => onSelectOne(job.id, checked)}
                    onDelete={() => onDelete(job.id)}
                    onDuplicate={() => onDuplicate(job.id)}
                    onToggleStatus={() => onToggleStatus(job.id, job.status)}
                />
            ))}
        </div>
    );
}
