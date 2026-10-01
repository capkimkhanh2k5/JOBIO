import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { applicationService } from '@/services/applicationService';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    reviewing: { label: 'Đang xem', className: 'bg-primary/8 text-primary border-primary/20' },
    shortlisted: { label: 'Shortlist', className: 'bg-teal-50 text-cyan-700 border-teal-200' },
    interview: { label: 'Phỏng vấn', className: 'bg-teal-50 text-teal-700 border-teal-200' },
    offered: { label: 'Đề xuất', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    accepted: { label: 'Đã nhận việc', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Từ chối', className: 'bg-red-50 text-red-700 border-red-200' },
};

function MatchScoreBadge({ score }: { score: number }) {
    const color = score >= 90 ? 'text-emerald-600' : score >= 80 ? 'text-primary' : 'text-amber-600';

    return (
        <div className={`flex items-center gap-1 text-sm font-bold ${color}`}>
            <span>{score}</span>
            <span className="text-[10px] font-semibold text-muted-foreground/60">/100</span>
        </div>
    );
}

export function RecentApplicationsTable() {
    const { data, isLoading } = useQuery({
        queryKey: ['company', 'applications', 'recent'],
        queryFn: () => applicationService.list({ ordering: '-applied_at', page_size: 10 }).then((r) => r.data.results),
        staleTime: 60_000,
    });

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <h3 className="text-lg font-bold text-foreground">Ứng tuyển gần đây</h3>
                <Link
                    to="/company/candidates"
                    className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary"
                >
                    Xem tất cả <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full" role="table">
                    <thead>
                        <tr className="border-b border-border/60 bg-muted/50">
                            {['Ứng viên', 'Vị trí', 'Trạng thái', 'Điểm Match', 'Ngày ứng tuyển'].map((col) => (
                                <th
                                    key={col}
                                    className="whitespace-nowrap px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array(5)
                                  .fill(null)
                                  .map((_, i) => (
                                      <tr key={i} className="border-b border-border/60">
                                          {Array(5)
                                              .fill(null)
                                              .map((__, j) => (
                                                  <td key={j} className="px-6 py-4">
                                                      <Skeleton className="h-5 w-full max-w-[120px]" />
                                                  </td>
                                              ))}
                                      </tr>
                                  ))
                            : data?.map((app, i) => {
                                  const status = STATUS_CONFIG[app.status] ?? {
                                      label: app.status,
                                      className: 'bg-muted text-foreground/80',
                                  };
                                  const candidateName = app.candidate_name || app.recruiter_name || 'Ứng viên';
                                  const candidateAvatar = app.candidate_avatar || app.recruiter_avatar || undefined;
                                  const candidateInitial = candidateName.split(' ').pop()?.charAt(0) || 'U';

                                  return (
                                      <motion.tr
                                          key={app.id}
                                          initial={{ opacity: 0, y: 8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: i * 0.04, duration: 0.3 }}
                                          className="group cursor-pointer border-b border-border/60 transition-colors hover:bg-muted"
                                      >
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-3">
                                                  <Avatar className="h-8 w-8 shrink-0 border border-border">
                                                      <AvatarImage src={candidateAvatar} />
                                                      <AvatarFallback className="bg-primary/8 text-xs font-bold text-primary">
                                                          {candidateInitial}
                                                      </AvatarFallback>
                                                  </Avatar>
                                                  <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                                                      {candidateName}
                                                  </span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                                                  {app.job_title}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4">
                                              <Badge className={`border text-[11px] font-bold shadow-none ${status.className}`}>
                                                  {status.label}
                                              </Badge>
                                          </td>
                                          <td className="px-6 py-4">
                                              <MatchScoreBadge score={app.match_score ?? app.ai_score ?? 0} />
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className="whitespace-nowrap text-sm text-muted-foreground">
                                                  {format(new Date(app.applied_at), 'dd MMM, HH:mm', { locale: vi })}
                                              </span>
                                          </td>
                                      </motion.tr>
                                  );
                              })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
