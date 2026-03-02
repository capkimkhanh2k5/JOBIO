import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { mockApi } from '@/services/mockApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Video, Phone, MapPin, ExternalLink, ChevronRight, CalendarX } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_CONFIG = {
    video: { label: 'Video call', icon: <Video className="w-3.5 h-3.5" />, className: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
    phone: { label: 'Điện thoại', icon: <Phone className="w-3.5 h-3.5" />, className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
    onsite: { label: 'Trực tiếp', icon: <MapPin className="w-3.5 h-3.5" />, className: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
};

export function UpcomingInterviewsCard() {
    const { data, isLoading } = useQuery({
        queryKey: ['employer', 'interviews', 'upcoming'],
        queryFn: mockApi.getUpcomingInterviews,
        staleTime: 60_000,
    });

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="font-bold text-lg">Phỏng vấn sắp tới</h3>
                <Link
                    to="/employer/interviews"
                    className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                    Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Items */}
            <div className="divide-y divide-white/5">
                {isLoading
                    ? Array(4).fill(null).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    ))
                    : !data?.length
                        ? (
                            <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
                                <CalendarX className="w-10 h-10 opacity-30" />
                                <p className="text-sm">Chưa có phỏng vấn nào sắp tới</p>
                            </div>
                        )
                        : data.map((interview, i) => {
                            const typeConf = TYPE_CONFIG[interview.type] ?? TYPE_CONFIG.video;
                            const scheduledDate = new Date(interview.scheduled_at);
                            return (
                                <motion.div
                                    key={interview.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.3 }}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                                >
                                    {/* Avatar */}
                                    <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                                        <AvatarImage src={interview.candidate_avatar} />
                                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
                                            {interview.candidate_name.split(' ').pop()?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm truncate">{interview.candidate_name}</p>
                                            <Badge className={`text-[10px] font-semibold border flex items-center gap-1 ${typeConf.className}`}>
                                                {typeConf.icon}
                                                {typeConf.label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{interview.job_title}</p>
                                        <p className="text-xs text-cyan-400/80 mt-1 font-medium">
                                            {format(scheduledDate, "EEEE, dd/MM · HH:mm", { locale: vi })}
                                        </p>
                                    </div>

                                    {/* Meeting link */}
                                    {interview.meeting_link && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all text-xs gap-1 shrink-0"
                                            asChild
                                        >
                                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-3 h-3" />
                                                Join
                                            </a>
                                        </Button>
                                    )}
                                </motion.div>
                            );
                        })
                }
            </div>
        </div>
    );
}
