import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { applicationService } from '@/services/applicationService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    reviewing: { label: 'Đang xem', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    interview: { label: 'Phỏng vấn', className: 'bg-violet-50 text-violet-700 border-violet-200' },
    offer: { label: 'Đề xuất', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Từ chối', className: 'bg-red-50 text-red-700 border-red-200' },
};

function AiScoreBadge({ score }: { score: number }) {
    const color = score >= 90 ? 'text-emerald-600' : score >= 80 ? 'text-blue-600' : 'text-amber-600';
    return (
        <div className={`flex items-center gap-1 font-bold text-sm ${color}`}>
            <span>{score}</span>
            <span className="text-[10px] font-semibold text-slate-400">/100</span>
        </div>
    );
}

export function RecentApplicationsTable() {
    const { data, isLoading } = useQuery({
        queryKey: ['employer', 'applications', 'recent'],
        queryFn: () => applicationService.list({ ordering: '-applied_at', page_size: 10 }).then(r => r.data.results),
        staleTime: 60_000,
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Ứng tuyển gần đây</h3>
                <Link
                    to="/employer/candidates"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                    Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full" role="table">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            {['Ứng viên', 'Vị trí', 'Trạng thái', 'AI Score', 'Ngày ứng tuyển'].map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array(5).fill(null).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    {Array(5).fill(null).map((__, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <Skeleton className="h-5 w-full max-w-[120px]" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : data?.map((app, i) => {
                                const status = STATUS_CONFIG[app.status] ?? { label: app.status, className: 'bg-slate-100 text-slate-700' };
                                return (
                                    <motion.tr
                                        key={app.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04, duration: 0.3 }}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                                    >
                                        {/* Ứng viên */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 border border-slate-200 shrink-0">
                                                    <AvatarImage src={app.recruiter_avatar || undefined} />
                                                    <AvatarFallback className="text-xs font-bold bg-blue-50 text-blue-700">
                                                        {(app.recruiter_name || 'U').split(' ').pop()?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">{app.recruiter_name || 'Ứng viên'}</span>
                                            </div>
                                        </td>
                                        {/* Vị trí */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{app.job_title}</span>
                                        </td>
                                        {/* Trạng thái */}
                                        <td className="px-6 py-4">
                                            <Badge className={`text-[11px] font-bold border ${status.className} shadow-none`}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        {/* AI Score */}
                                        <td className="px-6 py-4">
                                            <AiScoreBadge score={app.ai_score || 0} />
                                        </td>
                                        {/* Ngày ứng tuyển */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500 whitespace-nowrap">
                                                {format(new Date(app.applied_at), 'dd MMM, HH:mm', { locale: vi })}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
