import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Eye, Edit3, Copy, Users, XCircle, RotateCcw, Trash2,
    MoreHorizontal, Briefcase,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export type CompanyJob = {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'closed' | 'expired';
    published_at: string | null;
    application_deadline: string | null;
    views_count: number;
    applications_count: number;
    job_type: string;
    level: string;
    location: string;
    is_featured: boolean;
};

interface ManageJobsTableProps {
    jobs: CompanyJob[];
    isLoading: boolean;
    selectedIds: string[];
    onSelectAll: (checked: boolean) => void;
    onSelectOne: (id: string, checked: boolean) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: string) => void;
    pageSize: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm' },
    pending: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' },
    published: { label: 'Đang tuyển', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' },
    closed: { label: 'Đã đóng', className: 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' },
    expired: { label: 'Hết hạn', className: 'bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm' },
};

const JOB_TYPE_MAP: Record<string, string> = {
    full_time: 'Toàn thời gian',
    part_time: 'Bán thời gian',
    contract: 'Hợp đồng',
    internship: 'Thực tập',
    freelance: 'Freelance',
};

function TableSkeleton({ rows }: { rows: number }) {
    return (
        <>
            {Array(rows).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-48 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-12 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-12 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-8 rounded" /></td>
                </tr>
            ))}
        </>
    );
}

export function ManageJobsTable({
    jobs, isLoading, selectedIds, onSelectAll, onSelectOne,
    onDelete, onDuplicate, onToggleStatus, pageSize,
}: ManageJobsTableProps) {
    const navigate = useNavigate();
    const allSelected = jobs.length > 0 && jobs.every(j => selectedIds.includes(j.id));
    const someSelected = jobs.some(j => selectedIds.includes(j.id));

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="py-3 px-4 text-left w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                    onChange={e => onSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 bg-white checked:bg-violet-600 accent-violet-600 cursor-pointer"
                                    aria-label="Select all"
                                />
                            </th>
                            <th className="py-3 px-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Vị trí tuyển dụng
                            </th>
                            <th className="py-3 px-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="py-3 px-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                Ngày đăng
                            </th>
                            <th className="py-3 px-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Deadline
                            </th>
                            <th className="py-3 px-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <Eye className="w-3.5 h-3.5 inline" />
                            </th>
                            <th className="py-3 px-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <Users className="w-3.5 h-3.5 inline" />
                            </th>
                            <th className="py-3 px-4 w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={pageSize} />
                        ) : (
                            jobs.map((job, i) => {
                                const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
                                const isSelected = selectedIds.includes(job.id);
                                const isDeadlineSoon = job.application_deadline ? new Date(job.application_deadline).getTime() - Date.now() < 3 * 86400000 : false;
                                return (
                                    <motion.tr
                                        key={job.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.03 }}
                                        className={`border-b border-slate-100 last:border-0 transition-colors duration-150 group cursor-pointer
                                            ${isSelected ? 'bg-violet-50/50' : 'hover:bg-slate-50/80'}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={e => onSelectOne(job.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 bg-white accent-violet-600 cursor-pointer"
                                                aria-label={`Select ${job.title}`}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </td>

                                        {/* Title */}
                                        <td
                                            className="py-3 px-4 max-w-[260px]"
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                        >
                                            <div className="flex items-start gap-2">
                                                {job.is_featured && (
                                                    <span className="mt-0.5 shrink-0 text-[9px] font-bold bg-amber-100 text-amber-700 rounded px-1 py-0.5 uppercase tracking-wide">
                                                        Featured
                                                    </span>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">
                                                        {job.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {JOB_TYPE_MAP[job.job_type] ?? job.job_type} · {job.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={`text-[11px] font-bold border ${cfg.className}`}>
                                                {cfg.label}
                                            </Badge>
                                        </td>

                                        {/* Posted date */}
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-slate-600">
                                            {job.published_at ? format(new Date(job.published_at), 'dd/MM/yyyy', { locale: vi }) : '—'}
                                        </td>

                                        {/* Deadline */}
                                        <td className="py-3 px-4 whitespace-nowrap text-sm">
                                            <span className={isDeadlineSoon && job.status === 'published' ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                                                {job.application_deadline ? format(new Date(job.application_deadline), 'dd/MM/yyyy', { locale: vi }) : '—'}
                                                {isDeadlineSoon && job.status === 'published' && ' ⚠️'}
                                            </span>
                                        </td>

                                        {/* Views */}
                                        <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700">
                                            {job.views_count.toLocaleString()}
                                        </td>

                                        {/* Apps */}
                                        <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700">
                                            {job.applications_count}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                        aria-label="Job actions"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-52 bg-white border-slate-200 shadow-lg rounded-xl"
                                                >
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => navigate(`/jobs/${job.id}`)}
                                                    >
                                                        <Eye className="w-4 h-4" /> Xem chi tiết
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => navigate(`/company/jobs/${job.id}/edit`)}
                                                    >
                                                        <Edit3 className="w-4 h-4" /> Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => onDuplicate(job.id)}
                                                    >
                                                        <Copy className="w-4 h-4" /> Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => navigate(`/company/jobs/${job.id}/candidates`)}
                                                    >
                                                        <Users className="w-4 h-4" /> Xem ứng viên
                                                        {job.applications_count > 0 && (
                                                            <span className="ml-auto text-[11px] font-bold bg-violet-500/20 text-violet-300 rounded-full px-1.5">
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
                                                        className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                                        onClick={() => onDelete(job.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa tin
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Empty state inside table */}
            {!isLoading && jobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                        <Briefcase className="w-7 h-7 text-violet-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-900">Chưa có tin tuyển dụng</p>
                        <p className="text-sm text-slate-500 mt-1">Đăng tin đầu tiên để bắt đầu tuyển dụng!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
