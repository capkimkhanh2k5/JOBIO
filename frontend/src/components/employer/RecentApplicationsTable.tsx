import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { mockApi } from '@/services/mockApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: 'Chờ duyệt', className: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
    reviewing: { label: 'Đang xem', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20' },
    interview: { label: 'Phỏng vấn', className: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
    offer: { label: 'Đề xuất', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
    rejected: { label: 'Từ chối', className: 'bg-red-500/15 text-red-300 border-red-500/20' },
};

function AiScoreBadge({ score }: { score: number }) {
    const color = score >= 90 ? 'text-emerald-400' : score >= 80 ? 'text-cyan-400' : 'text-amber-400';
    return (
        <div className={`flex items-center gap-1 font-bold text-sm ${color}`}>
            <span>{score}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">/100</span>
        </div>
    );
}

export function RecentApplicationsTable() {
    const { data, isLoading } = useQuery({
        queryKey: ['employer', 'applications', 'recent'],
        queryFn: mockApi.getRecentApplications,
        staleTime: 60_000,
    });

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="font-bold text-lg">Ứng tuyển gần đây</h3>
                <Link
                    to="/employer/candidates"
                    className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                    Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full" role="table">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['Ứng viên', 'Vị trí', 'Trạng thái', 'AI Score', 'Ngày ứng tuyển'].map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array(5).fill(null).map((_, i) => (
                                <tr key={i} className="border-b border-white/5">
                                    {Array(5).fill(null).map((__, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <Skeleton className="h-5 w-full max-w-[120px]" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : data?.map((app, i) => {
                                const status = STATUS_CONFIG[app.status] ?? { label: app.status, className: 'bg-white/10 text-foreground' };
                                return (
                                    <motion.tr
                                        key={app.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04, duration: 0.3 }}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors group cursor-pointer"
                                    >
                                        {/* Ứng viên */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                                                    <AvatarImage src={app.candidate_avatar} />
                                                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
                                                        {app.candidate_name.split(' ').pop()?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm whitespace-nowrap">{app.candidate_name}</span>
                                            </div>
                                        </td>
                                        {/* Vị trí */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">{app.position}</span>
                                        </td>
                                        {/* Trạng thái */}
                                        <td className="px-6 py-4">
                                            <Badge className={`text-[11px] font-semibold border ${status.className}`}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        {/* AI Score */}
                                        <td className="px-6 py-4">
                                            <AiScoreBadge score={app.ai_score} />
                                        </td>
                                        {/* Ngày ứng tuyển */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
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
