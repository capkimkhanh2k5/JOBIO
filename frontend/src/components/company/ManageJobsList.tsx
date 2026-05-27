import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Eye, Edit3, Copy, Users, XCircle, RotateCcw, Trash2,
    MoreHorizontal, MapPin, Clock, Briefcase,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { CompanyJob } from './ManageJobsTable';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm' },
    published: { label: 'Đang tuyển', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' },
    closed: { label: 'Đã đóng', className: 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' },
    expired: { label: 'Hết hạn', className: 'bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm' },
};

const CHECKBOX_CLASS = 'border-slate-300 bg-white data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:text-white';

interface ManageJobsListProps {
    jobs: CompanyJob[];
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
            <div className="space-y-3">
                {Array(pageSize).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
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
                <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-violet-500" />
                </div>
                <div className="text-center">
                    <p className="font-semibold">Chưa có tin tuyển dụng</p>
                    <p className="text-sm text-muted-foreground mt-1">Đăng tin đầu tiên để bắt đầu tuyển dụng!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobs.map((job, i) => {
                const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
                const jobId = String(job.id);
                const isSelected = selectedIds.includes(jobId);

                return (
                    <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm transition-all duration-150 group
                            ${isSelected
                                ? 'bg-violet-50 border-violet-200 shadow-violet-100'
                                : 'bg-white border-slate-200 hover:bg-violet-50/50 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/70'
                            }`}
                    >
                        {/* Checkbox */}
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={checked => onSelectOne(jobId, checked === true)}
                            className={CHECKBOX_CLASS}
                            aria-label={`Select ${job.title}`}
                        />

                        {/* Title + meta */}
                        <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                {job.is_featured && (
                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded px-1 py-0.5 uppercase tracking-wide">
                                        Featured
                                    </span>
                                )}
                                <p className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors truncate">
                                    {job.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {job.application_deadline ? format(new Date(job.application_deadline), 'dd/MM/yyyy', { locale: vi }) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> {job.views_count.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-violet-600 font-semibold">
                                <Users className="w-3.5 h-3.5" /> {job.applications_count}
                            </span>
                        </div>

                        {/* Status badge */}
                        <Badge variant="outline" className={`shrink-0 text-xs font-medium px-2.5 py-0.5 border ${cfg.className}`}>
                            {cfg.label}
                        </Badge>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:bg-violet-50 hover:border-violet-100 hover:text-violet-600 transition-colors shrink-0 cursor-pointer"
                                    aria-label="Job actions"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-white border-slate-200 shadow-lg rounded-xl">
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                                    <Eye className="w-4 h-4" /> Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/company/jobs/${job.id}/edit`)}>
                                    <Edit3 className="w-4 h-4" /> Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onDuplicate(job.id)}>
                                    <Copy className="w-4 h-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/company/candidates?job_id=${job.id}`)}>
                                    <Users className="w-4 h-4" /> Xem ứng viên
                                    {job.applications_count > 0 && (
                                        <span className="ml-auto text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-1.5">
                                            {job.applications_count}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => onToggleStatus(job.id, job.status)}
                                >
                                    {job.status === 'published' ? (
                                        <><XCircle className="w-4 h-4 text-orange-400" /> Đóng tin</>
                                    ) : (
                                        <><RotateCcw className="w-4 h-4 text-emerald-400" /> Mở lại tin</>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
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
